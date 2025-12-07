import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { SalesController } from './controllers/sales.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { UsersController } from './controllers/users.controller';
import { DepartmentsController } from './controllers/departments.controller';
import { AppService } from './app.service';
import { TemporalModule } from './temporal/temporal.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Import all entities
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { SalesRecord } from './entities/sales-record.entity';
import { EtlJob } from './entities/etl-job.entity';
import { EtlErrorLog } from './entities/etl-error-log.entity';
import { AlertConfig } from './entities/alert-config.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { KpiConfig } from './entities/kpi-config.entity';
import { KpiSnapshot } from './entities/kpi-snapshot.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ScheduledReport } from './entities/scheduled-report.entity';
import { ExportHistory } from './entities/export-history.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { Department } from './entities/department.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Tenant,
          User,
          Department,
          SalesRecord,
          EtlJob,
          EtlErrorLog,
          AlertConfig,
          Role,
          Permission,
          UserRole,
          RolePermission,
          KpiConfig,
          KpiSnapshot,
          AuditLog,
          ScheduledReport,
          ExportHistory,
          DashboardWidget,
        ],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      SalesRecord,
      EtlJob,
      KpiConfig,
      KpiSnapshot,
      User,
      Role,
      UserRole,
      Department,
    ]),
    TemporalModule,
    AuthModule,
  ],
  controllers: [AppController, SalesController, DashboardController, UsersController, DepartmentsController],
  providers: [
    AppService,
    // Global JWT Guard - tất cả routes cần auth trừ @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
