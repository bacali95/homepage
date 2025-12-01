import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class CategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  getCategories(): string[] {
    return this.databaseService.getCategories();
  }
}
