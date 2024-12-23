import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { QuestionFactory } from 'test/factories/make-question-factory'
import { StudentFactory } from 'test/factories/make-student-factory'

describe('Fetch Recent Questions(E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let questionFactory: QuestionFactory
  let studentFactory: StudentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    jwt = moduleRef.get(JwtService)

    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)

    await app.init()
  })
  test('[GET] /questions', async () => {
    const user = await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: user.id.toString() })

    for (let i = 1; i <= 22; i++) {
      await questionFactory.makePrismaQuestion({
        title: `Question title ${i}`,
        authorId: user.id,
      })
    }

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()
    expect(response.status).toBe(200)

    expect(response.body.questions).not.toBeNull()
    expect(response.body.questions).not.toBeUndefined()
    expect(response.body.questions.length).toBe(20) // Verifica se 20 perguntas foram

    expect(response.body).toEqual(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            slug: expect.any(String),
            // content: expect.any(String), nao retornado mais devido ao mapper
            // authorId: expect.any(String), nao retornado mais devido ao mapper
          }),
        ]),
      }),
    )
  })
})
