import type { INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("telehealth-app API")
    .setDescription("REST API for the telehealth-app platform")
    .setVersion("0.0.1")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter your session token",
        in: "header",
      },
      "session-token",
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs.json",
    yamlDocumentUrl: "api/docs.yaml",
    customSiteTitle: "telehealth-app API Docs",
  })
}
