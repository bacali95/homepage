import "reflect-metadata";

import { Logger } from "@nestjs/common";

// Keep test output readable; errors/warnings logged by services are expected.
Logger.overrideLogger(false);
