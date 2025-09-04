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

	override chunks: readonly TextChunkExpression<'string' | 'nodes'>[] = []; // TODO change parent to only expose getter, then remove this

	readonly translationChunks: Map<string, ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>> = new Map();

	override getChunks(language: string): ReadonlyArray<TextChunkExpression<'nodes' | 'string'>> {
		if (this.translationChunks.has(language)) {
			return this.translationChunks.get(language)!;
		}
		if (this.translationChunks.has('default')) {
			return this.translationChunks.get('default')!;
		}
		return this.translationChunks.size > 0 ? this.translationChunks.values().next().value! : [];
	}

	private constructor(
		bind: BindDefinition,
		readonly role: Type,
		message: string
	) {
		super(bind.form, bind, null);

		if (isTranslationExpression(message)) {
			this.isTranslated = true;

			const messageId = /jr:itext\(['"](.*)['"]\)/.exec(message)?.[1]!; // TODO it must match because of isTranslationExpression


			this.form.xformDOM.itextTranslationElements.forEach((itextTranslationElement) => {
				const lang = itextTranslationElement.attributes.getNamedItem('lang')?.value ?? 'default';

				const name = itextTranslationElement.children.namedItem(messageId);
				const chunks: TextChunkExpression<'nodes' | 'string'>[] = [];
				for (const val of name?.childNodes!) {
					for (const child of val.childNodes)	{
						if (isElementNode(child)) {
							const output = TextChunkExpression.fromOutput(this, child);
							if (output) {
								chunks.push(output);
							}
						}

						if (isTextNode(child)) {
							chunks.push(TextChunkExpression.fromLiteral(this, child.data));
						}
					}
				}
				this.translationChunks.set(lang, chunks);
			});
		} else {
			this.translationChunks.set('default', [TextChunkExpression.fromLiteral(this, message)]);
		}
	}
}

// prettier-ignore
export type AnyMessageDefinition = MessageDefinition<TextBindAttributeLocalName>;
