import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeneralReportQueryDto, RenewalsReportQueryDto } from './dto/reports.dto';
import { ReportsService } from './reports.service';
import { AppException } from '../../common/exceptions/app.exception';

type ReportUser = {
  userId: string;
  type: string;
  institution_id?: string;
};

type ReportsServiceContract = {
  getStudents(user: ReportUser): Promise<Array<Record<string, unknown>>>;
  getCalled(user: ReportUser): Promise<Array<Record<string, unknown>>>;
  getToCall(user: ReportUser): Promise<Array<Record<string, unknown>>>;
  getRenewals(
    user: ReportUser,
    query: RenewalsReportQueryDto,
  ): Promise<Array<Record<string, unknown>>>;
  getDefaulters(user: ReportUser): Promise<Array<Record<string, unknown>>>;
  getGeneralReport(
    query: GeneralReportQueryDto,
    userInstitutionId?: string,
  ): Promise<Array<Record<string, unknown>>>;
  getPayments(orderId: string, userId: string): Promise<Array<Record<string, unknown>>>;
  getImpactReport(institutionId: string): Promise<Array<Record<string, unknown>>>;
};

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('students')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relatório de alunos (Admin ou Manager)' })
  async getStudents(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new AppException('forbidden');
    }
    const students = await this.reportsService.getStudents({
      userId: req.user.userId,
      type: req.user.type,
      institution_id: req.user.institution_id,
    });
    return { ok: true, students };
  }

  @Get('students/called')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alunos já contatados pelo admin logado' })
  async getCalled(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new AppException('forbidden');
    }

    const reportService = this.reportsService as ReportsServiceContract;
    const reportUser: ReportUser = {
      userId: req.user.userId,
      type: req.user.type,
      institution_id: req.user.institution_id,
    };
    const students = await reportService.getCalled(reportUser);

    return { ok: true, students };
  }

  @Get('students/to_call')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alunos que precisam de ligação (Apenas Admin)' })
  async getToCall(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new AppException('forbidden');
    }
    const students = await this.reportsService.getToCall({
      userId: req.user.userId,
      type: req.user.type,
    });
    return { ok: true, students };
  }

  @Get('students/defaulters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alunos inadimplentes (Admin ou Manager)' })
  async getDefaulters(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new AppException('forbidden');
    }
    const students = await this.reportsService.getDefaulters({
      userId: req.user.userId,
      type: req.user.type,
      institution_id: req.user.institution_id,
    });
    return { ok: true, students };
  }

  @Get('students/renewals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alunos com renovação próxima (Admin ou Manager)' })
  @ApiQuery({ name: 'days', required: false, description: 'Janela em dias para renovação' })
  async getRenewals(@Query() query: RenewalsReportQueryDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new AppException('forbidden');
    }

    const reportService = this.reportsService as ReportsServiceContract;
    const reportUser: ReportUser = {
      userId: req.user.userId,
      type: req.user.type,
      institution_id: req.user.institution_id,
    };
    const students = await reportService.getRenewals(reportUser, query);

    return { ok: true, students };
  }

  @Get('general')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relatório geral de pagamentos (Admin ou Manager)' })
  async getGeneralReport(@Query() query: GeneralReportQueryDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new AppException('forbidden');
    }
    // Só o gestor é escopado pelo próprio vínculo. Passar `req.user.institution_id` cru era
    // inofensivo enquanto o login não assinava a claim; agora que assina, um admin cuja
    // linha `User` tenha `institution_id` teria o relatório silenciosamente restrito a essa
    // instituição e o `?institution=` deixaria de funcionar para ele. Mesma guarda que
    // `/impact` já usa logo abaixo.
    const scopedInstitutionId = req.user.type === 'manager' ? req.user.institution_id : undefined;
    const payments = await this.reportsService.getGeneralReport(query, scopedInstitutionId);
    return { ok: true, payments };
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pagamentos de uma ordem do usuário autenticado' })
  @ApiQuery({ name: 'order_id', description: 'ID da ordem', required: true })
  async getPayments(
    @Query('order_id') orderId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!orderId) {
      throw new AppException('missing-order-id');
    }

    const reportService = this.reportsService as ReportsServiceContract;
    const payments = await reportService.getPayments(orderId, req.user.userId);
    return { ok: true, payments };
  }

  @Get('impact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relatório de impacto da instituição (Admin ou Manager)' })
  @ApiQuery({ name: 'institution', description: 'ID da instituição' })
  async getImpactReport(
    @Query('institution') institution: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new AppException('forbidden');
    }

    const instId = req.user.type === 'manager' ? req.user.institution_id : institution;
    if (!instId) {
      throw new AppException('missing-institution');
    }

    const scholarships = await this.reportsService.getImpactReport(instId);
    return { ok: true, scholarships };
  }
}
