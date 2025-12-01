import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";

import { AppsModule } from "./apps/apps.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { HttpLoggingInterceptor } from "./logger/http-logging.interceptor.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { PodsModule } from "./pods/pods.module.js";
import { UpdatesModule } from "./updates/updates.module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    DatabaseModule,
    AppsModule,
    CategoriesModule,
    UpdatesModule,
    PodsModule,
    JobsModule,
    NotificationsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "../dist"),
      serveStaticOptions: {
        cacheControl: true,
        maxAge: 31536000,
        immutable: true,
      },
      renderPath: /^(?!\/api).*/,
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
