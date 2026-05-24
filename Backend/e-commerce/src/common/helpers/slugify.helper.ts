export class SlugifyHelper {
    static async slugify(text: string): Promise<string> {
        const { default: slugify } = await import('@sindresorhus/slugify');
        return slugify(text, { separator: '-' });
    }
}
