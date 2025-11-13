import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { DatabaseModule } from "./database/database.module.js";
import { AppsModule } from "./apps/apps.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { ReleasesModule } from "./releases/releases.module.js";
import { UpdatesModule } from "./updates/updates.module.js";
import { PodsModule } from "./pods/pods.module.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { HealthModule } from "./health/health.module.js";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { HttpLoggingInterceptor } from "./logger/http-logging.interceptor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    DatabaseModule,
    AppsModule,
    CategoriesModule,
    ReleasesModule,
    UpdatesModule,
    PodsModule,
    JobsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "../dist"),
      exclude: ["/api*"],
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
