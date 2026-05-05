import { BaseResponse } from './response.dto';
import { ProjectDTO } from './project.dto';

export class ResponseProjectUpdateDTO extends BaseResponse(ProjectDTO, {
  description: 'el proyecto actualizado',
}) {}
