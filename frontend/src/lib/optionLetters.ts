const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const;

export type OptionLetterInput = {
  options?: Record<string, string | undefined | null> | null;
  subject?: string | null;
};

/**
 * Letras de alternativa que se deben mostrar.
 * Nunca rellena E si la pregunta no la trae (M1 oficial es A–D).
 */
export function getVisibleOptionLetters(input: OptionLetterInput): string[] {
  const fromOptions = LETTERS.filter((letter) => {
    const value = input.options?.[letter];
    return typeof value === 'string' && value.trim() !== '';
  });

  if (fromOptions.length > 0) {
    return fromOptions;
  }

  if (input.subject === 'M1' || input.subject === 'M2') {
    return ['a', 'b', 'c', 'd'];
  }

  return ['a', 'b', 'c', 'd', 'e'];
}
