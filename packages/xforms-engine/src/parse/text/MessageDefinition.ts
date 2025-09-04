import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { isElementNode, isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import type { BindDefinition } from '../model/BindDefinition.ts';
import { isTranslationExpression } from '../xpath/semantic-analysis.ts';
import type { TextBindAttributeLocalName } from './abstract/TextRangeDefinition.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export class MessageDefinition<
	Type extends TextBindAttributeLocalName,
> extends TextRangeDefinition<Type> {
	static from<Type extends TextBindAttributeLocalName>(
		bind: BindDefinition,
		type: Type
	): MessageDefinition<Type> | null {
		const message = bind.bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, type);

		if (message == null) {
			return null;
		}

		return new this(bind, type, message);
	}

	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>;

	private constructor(
		bind: BindDefinition,
		readonly role: Type,
		message: string
	) {
		super(bind.form, bind, null);

		if (isTranslationExpression(message)) {
			// TODO find a better way to get default language


			const itextTranslationElement = this.form.xformDOM.itextTranslationElements.find((itext) => {
				return itext.attributes.getNamedItem('lang')?.value === 'default'; // TODO get actual language
			});
			if (!itextTranslationElement) { // shouldn't happen
				this.chunks = [];
				return;
			}

			this._isTranslated = true;

			const messageId = /jr:itext\(['"](.*)['"]\)/.exec(message)?.[1];

			const name = itextTranslationElement.children.namedItem(messageId!);
			const chunky: TextChunkExpression<'nodes' | 'string'>[] = [];
			for (const val of name?.childNodes!) {
				for (const child of val.childNodes)	{
					if (isElementNode(child)) {
						const output = TextChunkExpression.fromOutput(this, child);
						if (output) {
							chunky.push(output);
						}
					}

					if (isTextNode(child)) {
						chunky.push(TextChunkExpression.fromLiteral(this, child.data));
					}
				}
			}
			this.chunks = chunky;
		} else {
			this.chunks = [TextChunkExpression.fromLiteral(this, message)];
		}
	}
}

// prettier-ignore
export type AnyMessageDefinition = MessageDefinition<TextBindAttributeLocalName>;
