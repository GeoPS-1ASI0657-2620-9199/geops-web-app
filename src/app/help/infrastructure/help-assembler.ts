import {HelpEntity} from '../domain/model/help.entity';
/**
 * Ensamblador para transformar datos de la API en entidades de ayuda.
 */
export class HelpAssembler {
  /**
   * Transforma la respuesta de la API en una entidad de ayuda.
   * @param response Respuesta de la API
   */
  static fromResponse(response: any): HelpEntity {
    return {
      id: response.id,
      question: response.question,
      answer: response.answer,
    };
  }

  static fromResponseArray(responseArray: any[]): HelpEntity[] {
    return responseArray.map(HelpAssembler.fromResponse);
  }
}
