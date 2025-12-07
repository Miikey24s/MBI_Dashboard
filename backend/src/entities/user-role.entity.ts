import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity()
@Unique(['userId', 'roleId']) // Một user không thể có trùng role
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  roleId: string;

  @CreateDateColumn()
  assignedAt: Date;
}
