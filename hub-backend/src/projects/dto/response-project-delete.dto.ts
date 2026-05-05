import { BaseResponse } from './response.dto';
import { ProjectDTO } from './project.dto';

export class ResponseProjectDeleteDTO extends BaseResponse(ProjectDTO, {
  description: 'el proyecto eliminado',
}) {}
