import React, { useEffect, useState } from 'react';
import * as emotion from 'emotion';
import * as emotionCore from '@emotion/core';
import * as emotionTheming from 'emotion-theming';
import { onConsentChange } from '@guardian/consent-management-platform';
import { getZIndex } from '@root/src/web/lib/getZIndex';
import { Props as BrazeBannerProps } from '@guardian/braze-components';
import { submitComponentEvent } from '@root/src/web/browser/ophan/ophan';
import { CanShowResult } from './bannerPicker';

export const brazeVendorId = '5ed8c49c4b8ce4571c7ad801';

type Meta = {
    dataFromBraze: {
        [key: string]: string;
    };
    logImpressionWithBraze: () => void;
    logButtonClickWithBraze: (id: number) => void;
};

type Props = {
    meta: Meta;
};

const containerStyles = emotion.css`
    position: fixed;
    bottom: -1px;
    width: 100%;
    ${getZIndex('banner')}
`;

export const hasRequiredConsents = (): Promise<boolean> =>
    new Promise((resolve) => {
        onConsentChange(({ tcfv2, ccpa }) => {
            const consentGivenUnderCcpa = ccpa && !ccpa.doNotSell;
            const consentGivenUnderTcfv2 =
                tcfv2 && tcfv2.vendorConsents[brazeVendorId];

            resolve(Boolean(consentGivenUnderCcpa || consentGivenUnderTcfv2));
        });
    });

type PreCheckArgs = {
    brazeSwitch: boolean;
    apiKey?: string;
    isDigitalSubscriber?: boolean;
    pageConfig: { [key: string]: any };
};

export const canShowPreChecks = ({
    brazeSwitch,
    apiKey,
    isDigitalSubscriber,
    pageConfig,
}: PreCheckArgs) =>
    Boolean(
        brazeSwitch &&
            apiKey &&
            isDigitalSubscriber &&
            !pageConfig.isPaidContent,
    );

const getMessageFromBraze = async (
    apiKey: string,
    brazeUuid: string,
): Promise<CanShowResult> => {
    const { default: appboy } = await import(
        /* webpackChunkName: "braze-web-sdk-core" */ '@braze/web-sdk-core'
    );

    appboy.initialize(apiKey, {
        enableLogging: false,
        noCookies: true,
        baseUrl: 'https://sdk.fra-01.braze.eu/api/v3',
        sessionTimeoutInSeconds: 1,
        minimumIntervalBetweenTriggerActionsInSeconds: 0,
    });

    return new Promise((resolve) => {
        appboy.subscribeToInAppMessage((message: any) => {
            const { extras } = message;

            const logButtonClickWithBraze = (internalButtonId: number) => {
                const thisButton = new appboy.InAppMessageButton(
                    `Button: ID ${internalButtonId}`,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    internalButtonId,
                );
                appboy.logInAppMessageButtonClick(thisButton, message);
            };

            const logImpressionWithBraze = () => {
                // Log the impression with Braze
                appboy.logInAppMessageImpression(message);
            };

            if (extras) {
                const meta = {
                    dataFromBraze: extras,
                    logImpressionWithBraze,
                    logButtonClickWithBraze,
                };
                resolve({ result: true, meta });
            } else {
                resolve({ result: false });
            }
        });

        appboy.changeUser(brazeUuid);
        appboy.openSession();
    });
};

const getBrazeMetaFromQueryString = (): Meta | null => {
    if (URLSearchParams) {
        const params = new URLSearchParams(window.location.search);
        const qsArg = 'force-braze-message';
        const value = params.get(qsArg);
        if (value) {
            try {
                const dataFromBraze = JSON.parse(value);

                return {
                    dataFromBraze,
                    logImpressionWithBraze: () => {},
                    logButtonClickWithBraze: () => {},
                };
            } catch (e) {
                // Parsing failed. Log a message and fall through.
                console.log(`There was an error with ${qsArg}: `, e.message);
            }
        }
    }

    return null;
};

// We can show a Braze banner if:
// - The Braze switch is on
// - We have a Braze API key
// - The user is a digital subscriber
// - We're not on a Glabs paid content page
// - We've got a Braze UUID from the API, given a user's ID Creds
// - The user has given Consent via CCPA or TCFV2
// - The Braze websdk appboy initialisation does not throw an error
// - The Braze app Boy subscription to in app message returns meta info
// OR
// - The force-braze-message query string arg is passed
export const canShow = async (
    asyncBrazeUuid: Promise<null | string>,
    isDigitalSubscriber: undefined | boolean,
): Promise<CanShowResult> => {
    const forcedBrazeMeta = getBrazeMetaFromQueryString();
    if (forcedBrazeMeta) {
        return {
            result: true,
            meta: forcedBrazeMeta,
        };
    }

    const { brazeSwitch } = window.guardian.config.switches;
    const apiKey = window.guardian.config.page.brazeApiKey;

    if (
        !canShowPreChecks({
            brazeSwitch,
            apiKey,
            isDigitalSubscriber,
            pageConfig: window.guardian.config.page,
        })
    ) {
        return { result: false };
    }

    const [brazeUuid, hasGivenConsent] = await Promise.all([
        asyncBrazeUuid,
        hasRequiredConsents(),
    ]);

    if (!(brazeUuid && hasGivenConsent)) {
        return { result: false };
    }

    try {
        return getMessageFromBraze(apiKey as string, brazeUuid);
    } catch (e) {
        return { result: false };
    }
};

type InnerProps = {
    meta: Meta;
    BrazeComponent: React.FC<BrazeBannerProps>;
};

const BrazeBannerWithSatisfiedDependencies = ({
    BrazeComponent,
    meta,
}: InnerProps) => {
    useEffect(() => {
        // Log the impression with Braze
        meta.logImpressionWithBraze();

        // Log VIEW event with Ophan
        submitComponentEvent({
            component: {
                componentType: 'RETENTION_ENGAGEMENT_BANNER',
                id: meta.dataFromBraze.componentName,
            },
            action: 'VIEW',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={containerStyles}>
            <BrazeComponent
                logButtonClickWithBraze={meta.logButtonClickWithBraze}
                submitComponentEvent={submitComponentEvent}
                componentName={meta.dataFromBraze.componentName}
                brazeMessageProps={meta.dataFromBraze}
            />
        </div>
    );
};

export const BrazeBanner = ({ meta }: Props) => {
    const [BrazeComponent, setBrazeComponent] = useState<
        React.FC<BrazeBannerProps>
    >();

    useEffect(() => {
        if (meta) {
            // TODO: unify the way we handle sharing these deps (this is
            // duplicated in SlotBodyEnd). Probably via the automat client
            // library.
            window.guardian.automat = {
                react: React,
                preact: React,
                emotionCore,
                emotionTheming,
                emotion,
            };

            import(
                /* webpackChunkName: "guardian-braze-components" */ '@guardian/braze-components'
            )
                .then((module) => {
                    setBrazeComponent(() => module.BrazeMessage);
                })
                .catch((error) =>
                    window.guardian.modules.sentry.reportError(
                        error,
                        'braze-banner',
                    ),
                );
        }
    }, [meta]);

    if (BrazeComponent && meta) {
        return (
            <BrazeBannerWithSatisfiedDependencies
                BrazeComponent={BrazeComponent}
                meta={meta}
            />
        );
    }

    return <div />;
};
