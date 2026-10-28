/** Relación de una palabra clave con un área profesional. */
export interface DictionaryAreaAssociation {
  id: string;
  nombre: string | null;
  peso: number;
}

/** Una entrada del diccionario, normalizada. `areas` es opcional: si falta o está vacía, la keyword no aporta a ninguna área. */
export interface DictionaryEntry {
  canonical: string;
  aliases: string[];
  areas?: DictionaryAreaAssociation[];
}
