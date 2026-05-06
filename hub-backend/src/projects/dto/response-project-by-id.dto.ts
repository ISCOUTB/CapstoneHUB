import { BaseResponse } from './response.dto';
import { ProjectDTO } from './project.dto';

export class ResponseProjectByIdDTO extends BaseResponse(ProjectDTO, {
  description: 'el proyecto encontrado',
}) {}
