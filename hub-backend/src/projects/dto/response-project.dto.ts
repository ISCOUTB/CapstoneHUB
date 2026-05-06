import { BaseResponse } from './response.dto';
import { ProjectDTO } from './project.dto';

export class ResponseProjectDTO extends BaseResponse(ProjectDTO, {
  description: 'el proyecto creado',
}) {}
