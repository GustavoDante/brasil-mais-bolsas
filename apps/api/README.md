<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

API NestJS da plataforma Brasil Mais Bolsas, construída com Prisma, Swagger, throttling global e validação obrigatória de entrada.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Seed database

```bash
$ npm run db:seed
```

Credenciais criadas pelo seed:

- Admin: `admin.seed@brasilmaisbolsas.local` / `Admin@123`
- Manager: `manager.seed@brasilmaisbolsas.local` / `Manager@123`
- User: `user.seed@brasilmaisbolsas.local` / `User@123`

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# integration tests
$ npm run test:integration

# test coverage
$ npm run test:cov
```

## Testes e cobertura (esteira)

- Unitários: `npm run test` — roda os testes unitários com Jest.
- E2E: `npm run test:e2e` — roda os testes HTTP com Jest e `supertest`.
- Integração: `npm run test:integration` — valida integrações reais, como Asaas em sandbox.
- Cobertura: `npm run test:cov` — gera relatório de cobertura.

Recomendações para CI (Windows PowerShell / Linux):

PowerShell (local):

```powershell
$env:NODE_ENV='test'
npm ci
npm run test -- --runInBand
```

Linux / macOS (CI):

```bash
NODE_ENV=test npm ci
npm run test -- --runInBand
```

Os testes e2e ficam em `test/e2e/` e a cobertura dos cenários por domínio é documentada em `test/e2e/COVERAGE_MATRIX.md`.

Os testes de integração ficam em `test/integration/` e dependem das variáveis de ambiente do sandbox configuradas no `.env`.

## Importar rotas (Swagger) no Postman

1. Habilite o Swagger localmente antes de iniciar a aplicação. No PowerShell:

```powershell
$env:SWAGGER_ENABLED='true'
npm run start:dev
```

2. Abra o Swagger UI em `http://localhost:3000/docs` (em ambiente local/dev ele fica disponível por padrão; o prefixo global `v1` é aplicado somente às rotas da API).

3. Para exportar a documentação, abra `http://localhost:3000/docs-json` no navegador e salve a resposta como `openapi.json`.

4. Abra o Postman → `Import` → selecione o arquivo `openapi.json` salvo. O Postman gerará uma coleção com as rotas documentadas.

Alternativa (importar por URL): use diretamente `http://localhost:3000/docs-json` no Postman `Import` → `Link`.

## Como usar o Authorize

1. Faça login em `POST /v1/auth/login`.
2. Copie o valor de `accessToken` retornado na resposta.
3. Clique em `Authorize` no Swagger e cole o token no campo Bearer.
4. Confirme em `Authorize`/`Close` e execute as rotas protegidas.

Se alguma requisição continuar retornando 401, teste colar o valor com o prefixo `Bearer ` na frente.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
