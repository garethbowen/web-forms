import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import type { XFormDefinition } from '../../parse/XFormDefinition.ts';
import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

interface LabelElement extends LocalNamedElement<'label'> {}

export class ItemsetLabelDefinition extends TextRangeDefinition<'item-label'> {
	static from(form: XFormDefinition, owner: ItemsetDefinition): ItemsetLabelDefinition | null {
		const labelElement = getLabelElement(owner.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, owner, labelElement);
	}

	readonly role = 'item-label';
	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>> = [];
	// readonly translationChunks: Map<string, ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>> = new Map();

	override getChunks(language: string): ReadonlyArray<TextChunkExpression<'nodes' | 'string'>> {

		if (language === 'default') {
			return [
				TextChunkExpression.fromLiteral(this, 'tiger'),
				TextChunkExpression.fromImage(this, 'jr://images/tiger.jpg'),
			];
		} else {
			return [
				TextChunkExpression.fromLiteral(this, 'Not found image'),
				TextChunkExpression.fromImage(this, 'jr://images/not-found.svg'),
			];
		}

	}

	private constructor(form: XFormDefinition, owner: ItemsetDefinition, element: LabelElement) {
		super(form, owner, element);

		const refExpression = element.getAttribute('ref');

		if (refExpression == null) {
			throw new Error('<itemset><label> missing ref attribute');
		}

		/*
		if (isTranslationExpression(refExpression)) {
			this.form.xformDOM.secondaryInstanceElements.forEach((instanceElement) => {
				if (instanceElement.getAttribute('id') === 'animals') { // TODO get id from itemset @nodeset
					const root = instanceElement.childNodes[1];
					root?.childNodes?.forEach((child) => {
						child.childNodes.forEach((grandchild) => {
							if (grandchild.nodeName === 'itextId') {
								const itextId = grandchild.textContent;

								console.log({child, grandchild});
							}
						});
					});
				}
			});
			const messageId = /jr:itext\(['"](.*)['"]\)/.exec(refExpression)?.[1]!; // TODO it must match because of isTranslationExpression
			this.form.xformDOM.itextTranslationElements.forEach((itextTranslationElement) => {
				const lang = itextTranslationElement.attributes.getNamedItem('lang')?.value ?? 'default';

				const name = itextTranslationElement.children.namedItem(messageId);
				const chunks: TextChunkExpression<'nodes' | 'string'>[] = [];
				console.log({ refExpression, lang, name });
			});
		};
*/
		const expression = TextChunkExpression.fromTranslation(this, refExpression); // TODO and this one?
		if (expression != null) {
			this.chunks = [expression];
		} else {
			this.chunks = [TextChunkExpression.fromReference(this, refExpression)];
		}
	}
}
