import React from 'react';
import { css, cx } from 'emotion';

import { Design } from '@guardian/types';
import { headline } from '@guardian/src-foundations/typography';
import { neutral, text } from '@guardian/src-foundations/palette';
import { from, until } from '@guardian/src-foundations/mq';

import { QuoteIcon } from '@frontend/web/components/QuoteIcon';
import { unescapeData } from '@root/src/lib/escapeData';

const partiallyLeft = css`
	width: 220px;
	margin-left: -10px;
	margin-right: 10px;
	padding-left: 10px;
	padding-right: 10px;
	clear: left;
	float: left;

	${until.mobileMedium} {
		width: 100%;
	}

	${from.leftCol} {
		margin-left: -120px;
	}

	:after {
		left: 10px;
		border-radius: 0 0 25px;

		${from.leftCol} {
			border-radius: 0 0 0 25px;
			left: 0;
			margin-left: 85px;
		}
	}
`;
const fullyLeft = css`
	margin-left: -10px;
	margin-right: 10px;
	padding-left: 10px;
	padding-right: 10px;
	clear: left;
	float: left;

	${until.mobileLandscape} {
		width: 100%;
	}
	${from.mobileLandscape} {
		width: 220px;
	}
	${from.leftCol} {
		width: 140px;
		margin-left: -150px;
	}
	${from.wide} {
		width: 200px;
		margin-left: -215px;
	}
`;

const partiallyInline = css`
	margin-left: 0;
	padding-left: 10px;
	padding-right: 10px;
	display: block;

	${from.mobileLandscape} {
		margin-left: -20px;
	}
	${from.phablet} {
		margin-left: -10px;
	}
	${from.leftCol} {
		margin-left: -38px;
	}

	:after {
		border-radius: 0 0 25px;
		left: 10px;

		${from.phablet} {
			left: 10px;
		}
		${from.leftCol} {
			left: 27px;
		}
	}
`;

const fullyInline = css`
	margin-left: -10px;
	display: block;
`;

function decidePosition(role: string, design: Design) {
	if (design === Design.PhotoEssay) {
		return role === 'supporting' ? fullyLeft : fullyInline;
	}
	return role === 'supporting' ? partiallyLeft : partiallyInline;
}

function decideFont(role: string) {
	if (role === 'supporting') {
		return css`
			${headline.xxsmall({ fontWeight: 'light' })};
		`;
	}
	return css`
		${headline.xsmall({ fontWeight: 'light' })};
	`;
}

export const PullQuoteBlockComponent: React.FC<{
	html?: string;
	palette: Palette;
	design: Design;
	role: string;
	attribution?: string;
}> = ({ html, palette, design, attribution, role }) => {
	if (!html) return <></>;
	switch (design) {
		case Design.Editorial:
		case Design.Letter:
		case Design.Comment:
			return (
				<aside
					className={cx(
						decidePosition(role, design),
						css`
							${headline.xxsmall({ fontWeight: 'light' })};
							line-height: 25px;
							position: relative;
							/* TODO: Source foundation doesn't have this colour, once it does, remove the hex below */
							/* stylelint-disable-next-line color-no-hex */
							background-color: #fbe6d5;
							padding-top: 6px;
							padding-bottom: 12px;
							margin-bottom: 28px;

							:after {
								content: '';
								width: 25px;
								height: 25px;
								bottom: -25px;
								position: absolute;
								/* TODO: Source foundation doesn't have this colour, once it does, remove the hex below */
								/* stylelint-disable-next-line color-no-hex */
								background-color: #fbe6d5;
							}
						`,
					)}
				>
					<QuoteIcon colour={palette.fill.quoteIcon} size="medium" />
					<blockquote
						className={css`
							display: inline;
						`}
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{
							__html: unescapeData(html),
						}}
					/>
					<footer>
						<cite>{attribution}</cite>
					</footer>
				</aside>
			);
		case Design.PhotoEssay:
			return (
				<aside
					className={cx(
						decidePosition(role, design),
						decideFont(role),
						css`
							color: ${palette.text.pullQuote};
							line-height: 25px;
							position: relative;
							padding-left: 10px;
							padding-right: 10px;
							padding-top: 6px;
							padding-bottom: 12px;
							margin-bottom: 16px;
						`,
					)}
				>
					<QuoteIcon colour={palette.fill.quoteIcon} size="large" />
					<blockquote
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{
							__html: unescapeData(html),
						}}
					/>
					<footer>
						<cite
							className={css`
								color: ${text.supporting};
							`}
						>
							{attribution}
						</cite>
					</footer>
				</aside>
			);
		default:
			return (
				<aside
					className={cx(
						decidePosition(role, design),
						css`
							${headline.xxsmall({ fontWeight: 'bold' })};
							line-height: 25px;
							position: relative;
							background-color: ${neutral[97]};
							padding-left: 10px;
							padding-right: 10px;
							padding-top: 6px;
							padding-bottom: 12px;
							margin-bottom: 1.75rem;
							color: ${palette.text.pullQuote};

							:after {
								content: '';
								width: 25px;
								height: 25px;
								bottom: -25px;
								position: absolute;
								background-color: ${neutral[97]};
							}
						`,
					)}
				>
					<QuoteIcon colour={palette.fill.quoteIcon} size="medium" />
					<blockquote
						className={css`
							display: inline;
						`}
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{
							__html: unescapeData(html),
						}}
					/>
					<footer>
						<cite
							className={css`
								color: ${palette.text.pullQuoteAttribution};
							`}
						>
							{attribution}
						</cite>
					</footer>
				</aside>
			);
	}
};
