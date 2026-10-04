/**
 * Entidad que representa un recurso de ayuda.
 */
export interface HelpEntity {
  /**
   * Identificador único del recurso de ayuda.
   */
  id: number;
  /**
   * Título del recurso de ayuda.
   */
  question: string;
  /**
   * Descripción o contenido del recurso de ayuda.
   */
  answer: string;
}
