import { Controller, Get, Logger } from "@nestjs/common";

import { CategoriesService } from "./categories.service.js";

@Controller("api/categories")
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getCategories() {
    try {
      return this.categoriesService.getCategories();
    } catch (error) {
      this.logger.error("Error fetching categories:", error);
      throw error;
    }
  }
}
