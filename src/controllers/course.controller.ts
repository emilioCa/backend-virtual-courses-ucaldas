import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef,










  HttpErrors, param,


  patch, post,




  put,

  requestBody
} from '@loopback/rest';
import {Course, Enroll} from '../models';
import {CourseRepository, EnrollRepository} from '../repositories';


class EnrollData {
  studentId: string;
  courseId: string;
}

export class CourseController {
  constructor(
    @repository(CourseRepository)
    public courseRepository: CourseRepository,
    @repository(EnrollRepository)
    public enrollRepository: EnrollRepository
  ) {}

  @authenticate('TokenAdminStrategy')
  @post('/course', {
    responses: {
      '200': {
        description: 'Course model instance',
        content: {'application/json': {schema: getModelSchemaRef(Course)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Course, {
            title: 'NewCourse',
            exclude: ['id'],
          }),
        },
      },
    })
    course: Omit<Course, 'id'>,
  ): Promise<Course> {
    return this.courseRepository.create(course);
  }

  @get('/course/count', {
    responses: {
      '200': {
        description: 'Course model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Course) where?: Where<Course>,
  ): Promise<Count> {
    return this.courseRepository.count(where);
  }

  @get('/course', {
    responses: {
      '200': {
        description: 'Array of Course model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Course, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Course) filter?: Filter<Course>,
  ): Promise<Course[]> {
    return this.courseRepository.find(filter);
  }

  @authenticate('TokenAdminStrategy')
  @patch('/course', {
    responses: {
      '200': {
        description: 'Course PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Course, {partial: true}),
        },
      },
    })
    course: Course,
    @param.where(Course) where?: Where<Course>,
  ): Promise<Count> {
    return this.courseRepository.updateAll(course, where);
  }

  @get('/course/{id}', {
    responses: {
      '200': {
        description: 'Course model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Course, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Course, {exclude: 'where'}) filter?: FilterExcludingWhere<Course>
  ): Promise<Course> {
    return this.courseRepository.findById(id, filter);
  }

  @authenticate('TokenAdminStrategy')
  @patch('/course/{id}', {
    responses: {
      '204': {
        description: 'Course PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Course, {partial: true}),
        },
      },
    })
    course: Course,
  ): Promise<void> {
    await this.courseRepository.updateById(id, course);
  }

  @authenticate('TokenAdminStrategy')
  @put('/course/{id}', {
    responses: {
      '204': {
        description: 'Course PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() course: Course,
  ): Promise<void> {
    await this.courseRepository.replaceById(id, course);
  }

  @authenticate('TokenAdminStrategy')
  @del('/course/{id}', {
    responses: {
      '204': {
        description: 'Course DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.courseRepository.deleteById(id);
  }



  @authenticate('TokenStudentStrategy')
  @post('/course-enrollment', {
    responses: {
      '200': {
        description: 'Login for users'
      }
    }
  })
  async enroll(
    @requestBody() enrollData: EnrollData
  ): Promise<Boolean> {
    let course = await this.courseRepository.findById(enrollData.courseId);
    console.log(enrollData);
    if (course) {
      let exists = await this.enrollRepository.findOne({where: {and: [{courseId: enrollData.courseId}, {studentId: enrollData.studentId}]}});
      console.log(exists);
      if (exists) {
        return false;
      }
      let currentdate = new Date();
      let finishdate: Date = new Date();
      finishdate.setDate(currentdate.getDate() + (course.duration ?? 0 * 7));
      let enroll = new Enroll({
        approbedSections: 0,
        courseId: enrollData.courseId,
        studentId: enrollData.studentId,
        startDate: currentdate,
        finishDate: finishdate
      });
      this.enrollRepository.create(enroll);
      return true;
    }
    throw new HttpErrors[403]("This course does not exists!");
  }

}
