import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface MenuCard {
  id: string;
  title: string;
  icon: string;
  colorClass: string;
  iconColorClass: string;
}

interface Student {
  id: string;
  name: string;
  morningStatus: 'unmarked' | 'present' | 'late' | 'excused' | 'unexcused';
  afternoonStatus: 'unmarked' | 'present' | 'late' | 'excused' | 'unexcused';
  note: string;
}

interface LeaveRequest {
  id: string;
  studentName: string;
  parentName: string;
  phoneNumber: string;
  recipient: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherNote?: string;
  submittedAt?: string;
  className?: string;
  morning?: boolean;
  afternoon?: boolean;
  note?: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'leave_request' | 'attendance' | 'system';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-blue-50 font-sans text-slate-800 flex flex-col relative">
      <!-- Header -->
      <header class="bg-blue-800 text-white shadow-md sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <mat-icon class="text-3xl">school</mat-icon>
            <h1 class="text-xl font-semibold tracking-tight hidden sm:block">Hệ thống Điểm danh Thông minh</h1>
            <h1 class="text-xl font-semibold tracking-tight sm:hidden">Điểm danh</h1>
          </div>
          
          <!-- Role Selector (Demo) -->
          <div class="flex items-center gap-2 sm:gap-4">
            <button (click)="toggleRole()" class="flex items-center gap-2 text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded-full border border-blue-600 transition-colors">
              <mat-icon class="text-sm">swap_horiz</mat-icon>
              <span>
                @switch (currentRole()) {
                  @case ('teacher') { Giáo viên chủ nhiệm }
                  @case ('parent') { Phụ huynh học sinh }
                  @case ('student') { Học sinh }
                  @case ('board') { Ban giám hiệu }
                }
              </span>
            </button>
            <button (click)="toggleNotifications()" 
                    class="p-2 hover:bg-blue-600 rounded-full transition-colors flex items-center justify-center relative">
              <mat-icon>notifications</mat-icon>
              @if (unreadNotificationsCount() > 0 && currentRole() === 'teacher') {
                <span class="absolute top-1 right-1 flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold items-center justify-center text-white">{{ unreadNotificationsCount() }}</span>
                </span>
              }

              <!-- Notification Dropdown -->
              @if (showNotifications() && currentRole() === 'teacher') {
                <div class="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-sm">Thông báo</span>
                    <button (click)="$event.stopPropagation(); showNotifications.set(false)" class="text-slate-400 hover:text-slate-600">
                      <mat-icon class="text-sm">close</mat-icon>
                    </button>
                  </div>
                  <div class="max-h-96 overflow-y-auto">
                    @if (notifications().length === 0) {
                      <div class="p-8 text-center text-slate-400">
                        <mat-icon class="text-4xl mb-2">notifications_off</mat-icon>
                        <p class="text-xs">Không có thông báo nào</p>
                      </div>
                    } @else {
                      @for (n of notifications(); track n.id) {
                        <div class="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-default">
                          <div class="flex items-start gap-3">
                            <div [class]="n.type === 'leave_request' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'"
                                 class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                              <mat-icon class="text-sm">{{ n.type === 'leave_request' ? 'mail' : 'info' }}</mat-icon>
                            </div>
                            <div class="flex-grow">
                              <div class="text-xs font-bold text-slate-900">{{ n.title }}</div>
                              <div class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{{ n.message }}</div>
                              <div class="text-[10px] text-slate-400 mt-1">{{ n.time }}</div>
                            </div>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </button>
            <button class="p-2 hover:bg-blue-600 rounded-full transition-colors flex items-center justify-center">
              <mat-icon>account_circle</mat-icon>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        <!-- Top Summary Bar (Teacher & Board) -->
        @if (currentRole() === 'teacher' || currentRole() === 'board') {
          <div class="mb-2 flex flex-col gap-2">
            <!-- Reminder Message (Red & Prominent) - Only for Teacher -->
            @if (currentRole() === 'teacher') {
              <div class="flex items-start sm:items-center gap-3 text-red-600 px-4">
                <mat-icon class="text-red-600 animate-pulse mt-0.5 sm:mt-0">warning</mat-icon>
                <span class="text-sm sm:text-base font-bold">LƯU Ý: Thầy/Cô vui lòng kiểm tra lại kết quả nhận diện từ Camera AI và thực hiện điểm danh thủ công.</span>
              </div>
            }

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <mat-icon class="text-blue-800">dashboard</mat-icon>
                  Tổng quan điểm danh trong ngày
                </h2>
                
                <!-- Date Picker Integrated -->
                <div class="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5 hover:border-blue-400 focus-within:border-blue-500 transition-colors">
                  <span class="text-sm text-slate-500 font-medium mr-2 hidden sm:inline">Ngày:</span>
                  <input type="date" [value]="currentDate()" (change)="onDateChange($event)" class="bg-transparent border-none focus:outline-none text-slate-800 font-bold cursor-pointer outline-none text-sm">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Unrecognized -->
                <div class="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-4 shadow-md flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shadow-sm relative shrink-0 backdrop-blur-sm">
                       <mat-icon>document_scanner</mat-icon>
                       @if (unmarkedCount() > 0) {
                         <span class="absolute -top-2 -right-2 flex h-5 w-5 z-10">
                           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                           <span class="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white shadow-sm"></span>
                         </span>
                       }
                    </div>
                    <div>
                      <div class="text-sm text-indigo-100 font-medium mb-1">Chưa nhận diện</div>
                      <div class="text-2xl font-black text-white leading-none">{{ unmarkedCount() }} <span class="text-xs font-normal text-indigo-200">học sinh</span></div>
                    </div>
                  </div>
                  <button (click)="viewUnrecognized()" class="w-full py-2.5 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    Lịch sử nhận diện <mat-icon class="text-sm icon-xs">arrow_forward</mat-icon>
                  </button>
                </div>

                <!-- Late -->
                <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 shadow-md flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shadow-sm shrink-0 backdrop-blur-sm">
                       <mat-icon>schedule</mat-icon>
                     </div>
                     <div>
                       <div class="text-sm text-amber-100 font-medium mb-1">Học sinh đi trễ</div>
                       <div class="text-2xl font-black text-white leading-none">{{ lateCount() }} <span class="text-xs font-normal text-amber-200">học sinh</span></div>
                     </div>
                  </div>
                  <button (click)="viewLateStudents()" class="w-full py-2.5 bg-white text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    Xem điểm danh <mat-icon class="text-sm icon-xs">arrow_forward</mat-icon>
                  </button>
                </div>

                <!-- Leave Requests -->
                <div class="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-4 shadow-md flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shadow-sm shrink-0 backdrop-blur-sm">
                       <mat-icon>mark_email_unread</mat-icon>
                     </div>
                     <div>
                       <div class="text-sm text-sky-100 font-medium mb-1">Đơn xin phép</div>
                       <div class="text-2xl font-black text-white leading-none">{{ pendingLeaveCount() }} <span class="text-xs font-normal text-sky-200">đơn mới</span></div>
                     </div>
                  </div>
                  <button (click)="viewLeaveRequests()" class="w-full py-2.5 bg-white text-sky-700 rounded-lg text-sm font-bold hover:bg-sky-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    Quản lý đơn nghỉ <mat-icon class="text-sm icon-xs">arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Top Summary Bar (Parent & Student) -->
        @if (currentRole() === 'parent' || currentRole() === 'student') {
          <div class="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <mat-icon>face</mat-icon>
              </div>
              <div>
                <div class="text-xs text-slate-500 font-bold uppercase tracking-wider">Học sinh</div>
                <div class="font-bold text-slate-900">
                  @if (currentRole() === 'student') {
                    {{ myChild.name }} (Tôi)
                  } @else {
                    {{ myChild.name }} - {{ myChild.id }}
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Sidebar + Content Layout -->
        <div class="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
          
          <!-- Left Column: Features Menu -->
          <div class="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3">
            @for (card of menuCards(); track card.id) {
              <button (click)="setActiveView(card.id)"
                   class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 text-left w-full"
                   [ngClass]="activeView() === card.id ? 'bg-blue-800 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-blue-400'">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     [ngClass]="activeView() === card.id ? 'bg-white/20' : card.colorClass">
                  <mat-icon [ngClass]="activeView() === card.id ? 'text-white' : card.iconColorClass">{{ card.icon }}</mat-icon>
                </div>
                <div class="flex-grow">
                  <h3 class="font-semibold text-sm">{{ card.title }}</h3>
                </div>
                @if (activeView() === card.id) {
                  <mat-icon class="text-sm">chevron_right</mat-icon>
                }
              </button>
            }
          </div>

          <!-- Right Column: Dynamic Content Area -->
          <div class="flex-grow bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
            
            @switch (activeView()) {
              
              <!-- VIEW: AI ATTENDANCE (BOARD) -->
              @case ('ai_attendance') {
                <div class="p-4 sm:p-6 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                  <mat-icon class="text-indigo-600">camera_front</mat-icon>
                  <h3 class="text-lg font-bold text-slate-900">Tình trạng điểm danh Camera AI</h3>
                </div>
                
                <div class="p-6">
                  <!-- AI Stats Summary (Reused from top bar but larger) -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                        <mat-icon>check_circle</mat-icon>
                      </div>
                      <div>
                        <div class="text-2xl font-bold text-slate-900">{{ presentCount() }}</div>
                        <div class="text-sm text-slate-500">Có mặt</div>
                      </div>
                    </div>
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-white text-amber-500 flex items-center justify-center shadow-sm">
                        <mat-icon>schedule</mat-icon>
                      </div>
                      <div>
                        <div class="text-2xl font-bold text-slate-900">{{ lateCount() }}</div>
                        <div class="text-sm text-slate-500">Đi trễ</div>
                      </div>
                    </div>
                    <div class="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-sm">
                        <mat-icon>cancel</mat-icon>
                      </div>
                      <div>
                        <div class="text-2xl font-bold text-slate-900">{{ unexcusedCount() }}</div>
                        <div class="text-sm text-slate-500">Vắng không phép</div>
                      </div>
                    </div>
                    <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-sm relative">
                        <mat-icon>document_scanner</mat-icon>
                        <span class="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
                      </div>
                      <div>
                        <div class="text-2xl font-bold text-slate-900">{{ unmarkedCount() }}</div>
                        <div class="text-sm text-slate-500">Chưa nhận diện</div>
                      </div>
                    </div>
                  </div>

                  <!-- Mock Camera Feed Grid -->
                  <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <mat-icon class="text-red-500 animate-pulse">fiber_manual_record</mat-icon>
                    Camera trực tiếp - Lớp 10A1
                  </h4>
                  <div class="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group">
                    <div class="text-slate-500 flex flex-col items-center">
                      <mat-icon class="text-6xl mb-2 opacity-50">videocam_off</mat-icon>
                      <span>Mô phỏng Camera AI</span>
                    </div>
                    <!-- Overlay Stats -->
                    <div class="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-mono">
                      CAM-01 • 10A1 • {{ formattedDate() }}
                    </div>
                    <div class="absolute bottom-4 right-4 bg-emerald-600/90 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                      <mat-icon class="text-sm">face</mat-icon> Đã nhận diện: {{ presentCount() + lateCount() }}/{{ students().length }}
                    </div>
                  </div>
                </div>
              }

              <!-- VIEW: LỊCH SỬ NHẬN DIỆN -->
              @case ('recognition_history') {
                <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-purple-600">history</mat-icon>
                      <h3 class="text-lg font-bold text-slate-900">Lịch sử nhận diện</h3>
                    </div>
                    <p class="text-sm text-slate-500">Xem lại lịch sử nhận diện khuôn mặt từ Camera AI</p>
                  </div>
                  
                  <div class="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 hover:border-blue-400 focus-within:border-blue-500 transition-colors shadow-sm">
                    <span class="text-sm text-slate-500 font-medium mr-2 hidden sm:inline">Ngày:</span>
                    <input type="date" [value]="recognitionDate()" (input)="recognitionDate.set($any($event.target).value)" class="bg-transparent border-none focus:outline-none text-slate-800 font-bold cursor-pointer outline-none text-sm">
                  </div>
                </div>

                <div class="p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (rec of filteredRecognitionHistory(); track rec.id) {
                      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                        <div class="aspect-video bg-slate-100 relative">
                          <img [src]="'https://picsum.photos/seed/' + rec.studentId + '/400/300'" alt="Recognition Image" class="w-full h-full object-cover">
                          <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-mono">
                            {{ rec.time }}
                          </div>
                          <div class="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <mat-icon class="text-[14px] w-[14px] h-[14px]">check_circle</mat-icon> {{ (rec.confidence * 100).toFixed(0) }}%
                          </div>
                        </div>
                        <div class="p-4">
                          <div class="flex items-start justify-between mb-2">
                            <div>
                              <h4 class="font-bold text-slate-900">{{ rec.studentName }}</h4>
                              <div class="text-xs text-slate-500">{{ rec.studentId }}</div>
                            </div>
                            <div [class]="rec.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                                 class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                              {{ rec.status === 'success' ? 'Đúng giờ' : 'Đi trễ' }}
                            </div>
                          </div>
                          <div class="flex gap-2 mt-4">
                            <button class="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                              Xem chi tiết
                            </button>
                            <button class="flex-1 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                              Báo sai
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                    @if (filteredRecognitionHistory().length === 0) {
                      <div class="col-span-full text-center py-12 text-slate-400">
                        <mat-icon class="text-6xl mb-4 opacity-20">face_retouching_off</mat-icon>
                        <p>Không có dữ liệu nhận diện cho ngày này</p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- VIEW: ĐIỂM DANH THỦ CÔNG -->
              @case ('attendance') {
                <!-- Top Action Bar -->
                <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <mat-icon class="text-blue-900">fact_check</mat-icon>
                  <h3 class="text-lg font-bold text-slate-900">Điểm danh thủ công</h3>
                </div>

                <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p class="text-sm text-slate-800 font-extrabold">Lớp 10A1 • Sĩ số: {{ students().length }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <!-- Session Selector for Stats & Filtering -->
                    <div class="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
                      <button (click)="currentSession.set('morning')" 
                              [class]="currentSession() === 'morning' ? 'bg-white text-emerald-700 shadow-md ring-1 ring-black/5' : 'text-emerald-600/60 hover:bg-slate-200'"
                              class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 group">
                        <!-- Custom Morning Icon (Small) -->
                        <div class="w-8 h-8 rounded-full bg-gradient-to-b from-amber-50 to-emerald-50 border-2 border-white shadow-sm relative overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                          <div class="absolute top-1 left-1 w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>
                          <div class="absolute bottom-0 right-0 w-6 h-4 bg-emerald-400 rounded-tl-[12px] opacity-80"></div>
                        </div>
                        <span class="font-black">Buổi sáng</span>
                      </button>
                      <button (click)="currentSession.set('afternoon')" 
                              [class]="currentSession() === 'afternoon' ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5' : 'text-blue-600/60 hover:bg-slate-200'"
                              class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 group">
                        <!-- Custom Afternoon Icon (Small) -->
                        <div class="w-8 h-8 rounded-full bg-gradient-to-b from-sky-100 to-blue-50 border-2 border-white shadow-sm relative overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm z-10"></div>
                          <div class="absolute inset-0 flex items-center justify-center opacity-50">
                             <div class="w-5 h-0.5 bg-rose-400 rounded-full absolute rotate-0"></div>
                             <div class="w-5 h-0.5 bg-rose-400 rounded-full absolute rotate-45"></div>
                             <div class="w-5 h-0.5 bg-rose-400 rounded-full absolute rotate-90"></div>
                             <div class="w-5 h-0.5 bg-rose-400 rounded-full absolute rotate-135"></div>
                          </div>
                        </div>
                        <span class="font-black">Buổi chiều</span>
                      </button>
                    </div>

                    <div class="relative">
                      <select [value]="selectedFilter()" (change)="onFilterChange($event)" class="appearance-none pl-10 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer h-full">
                        <option value="all">Tất cả trạng thái</option>
                        <option value="unmarked">Chưa điểm danh</option>
                        <option value="present">Có mặt</option>
                        <option value="late">Đi trễ</option>
                        <option value="excused">Vắng có phép</option>
                        <option value="unexcused">Vắng không phép</option>
                      </select>
                      <mat-icon class="text-sm absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">filter_list</mat-icon>
                    </div>

                    <button (click)="saveAttendance()" class="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-950 transition-all flex items-center gap-2 shadow-md active:scale-95">
                      <mat-icon>save</mat-icon> Lưu điểm danh
                    </button>
                  </div>
                </div>

                <div class="p-4 sm:p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table class="w-full text-left border-collapse min-w-[700px] border border-slate-200">
                    <thead class="sticky top-0 z-10 bg-blue-900 text-white shadow-md">
                      <tr class="text-sm">
                        <th class="p-4 font-bold w-64 border border-blue-800 text-center">Họ và tên</th>
                        <th class="p-4 font-bold text-center border border-blue-800">
                          Trạng thái điểm danh
                        </th>
                      </tr>
                    </thead>
                    <tbody class="text-sm">
                      @for (student of filteredStudents(); track student.id) {
                        <tr class="hover:bg-slate-50 transition-colors group">
                          <td class="p-4 font-semibold text-slate-900 border border-slate-200">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                {{ student.name.charAt(0) }}
                              </div>
                              {{ student.name }}
                            </div>
                          </td>
                          
                          <!-- Dynamic Session Column -->
                          <td class="p-4 border border-slate-200">
                            <div class="flex items-center justify-center gap-1.5">
                              @if (currentSession() === 'morning') {
                                <button (click)="updateStudentStatus(student.id, 'morning', 'present')" 
                                        [class]="student.morningStatus === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Có mặt
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'morning', 'late')" 
                                        [class]="student.morningStatus === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Đi trễ
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'morning', 'excused')" 
                                        [class]="student.morningStatus === 'excused' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Có phép
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'morning', 'unexcused')" 
                                        [class]="student.morningStatus === 'unexcused' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Không phép
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'morning', 'unmarked')" 
                                        [class]="student.morningStatus === 'unmarked' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Chưa điểm danh
                                </button>
                              } @else {
                                <button (click)="updateStudentStatus(student.id, 'afternoon', 'present')" 
                                        [class]="student.afternoonStatus === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Có mặt
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'afternoon', 'late')" 
                                        [class]="student.afternoonStatus === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Đi trễ
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'afternoon', 'excused')" 
                                        [class]="student.afternoonStatus === 'excused' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Có phép
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'afternoon', 'unexcused')" 
                                        [class]="student.afternoonStatus === 'unexcused' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Không phép
                                </button>
                                <button (click)="updateStudentStatus(student.id, 'afternoon', 'unmarked')" 
                                        [class]="student.afternoonStatus === 'unmarked' ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'"
                                        class="px-3 py-2 rounded-md text-xs font-bold transition-all">
                                  Chưa điểm danh
                                </button>
                              }
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- VIEW: QUẢN LÝ ĐƠN NGHỈ -->
              @case ('leave_requests') {
                <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-sky-600">mark_email_unread</mat-icon>
                      <h3 class="text-lg font-bold text-slate-900">Quản lý đơn nghỉ</h3>
                    </div>
                    <p class="text-sm text-slate-500">Danh sách đơn xin phép nghỉ học từ phụ huynh</p>
                  </div>
                  
                  <!-- Teacher Leave Tabs -->
                  <div class="flex items-center gap-4">
                    <div class="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 hover:border-blue-400 focus-within:border-blue-500 transition-colors shadow-sm">
                      <span class="text-sm text-slate-500 font-medium mr-2 hidden sm:inline">Ngày:</span>
                      <input type="date" [value]="teacherLeaveDate()" (input)="teacherLeaveDate.set($any($event.target).value)" class="bg-transparent border-none focus:outline-none text-slate-800 font-bold cursor-pointer outline-none text-sm">
                    </div>

                    <div class="flex bg-slate-200 p-1.5 rounded-xl shadow-inner">
                      <button (click)="teacherLeaveTab.set('pending')" 
                              [class]="teacherLeaveTab() === 'pending' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                              class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <mat-icon class="text-sm">hourglass_empty</mat-icon> Chờ duyệt
                        @if (pendingLeaveCount() > 0) {
                          <span class="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ pendingLeaveCount() }}</span>
                        }
                      </button>
                      <button (click)="teacherLeaveTab.set('history')" 
                              [class]="teacherLeaveTab() === 'history' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                              class="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <mat-icon class="text-sm">history</mat-icon> Lịch sử duyệt
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-6">
                  <div class="grid gap-4">
                    @for (req of filteredTeacherLeaveRequests(); track req.id) {
                      <div (click)="openLeaveDetail(req)"
                           (keyup.enter)="openLeaveDetail(req)"
                           tabindex="0"
                           role="button"
                           class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-sky-300 transition-all shadow-sm cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <div class="flex items-start gap-4">
                          <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                            {{ req.studentName.charAt(0) }}
                          </div>
                          <div>
                            <h4 class="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{{ req.studentName }}</h4>
                            <div class="flex items-center gap-2 text-sm text-slate-500 mt-1">
                              <mat-icon class="text-[16px]">event</mat-icon>
                              <span>Ngày nghỉ: <span class="font-medium text-slate-700">{{ req.date }}</span></span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                          <div [class]="req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'"
                               class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/10">
                            {{ req.status === 'approved' ? 'Đã duyệt' : req.status === 'pending' ? 'Đang chờ duyệt' : 'Đã từ chối' }}
                          </div>
                          <mat-icon class="text-slate-300 group-hover:text-sky-600 transition-colors">chevron_right</mat-icon>
                        </div>
                      </div>
                    }
                    @if (filteredTeacherLeaveRequests().length === 0) {
                      <div class="text-center py-12 text-slate-400">
                        <mat-icon class="text-6xl mb-4 opacity-20">inbox</mat-icon>
                        <p>Không có đơn nghỉ nào trong mục này</p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- VIEW: BÁO CÁO -->
              @case ('reports') {
                <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-cyan-600">analytics</mat-icon>
                      <h3 class="text-lg font-bold text-slate-900">Báo cáo / Xuất dữ liệu</h3>
                    </div>
                    <p class="text-sm text-slate-500">Thống kê điểm danh và xuất file Excel</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                      <mat-icon class="text-sm">download</mat-icon> Xuất Excel
                    </button>
                  </div>
                </div>

                <div class="p-6">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      @switch (teacherReportPeriod()) {
                        @case ('week') { Báo cáo tuần này }
                        @case ('month') { Báo cáo tháng 3 }
                        @case ('semester') { Báo cáo Học kỳ I }
                        @case ('year') { Báo cáo Năm học 2025-2026 }
                      }
                    </h4>
                    <div class="flex gap-2">
                      <!-- Period Type Selector -->
                      <div class="relative">
                        <select [value]="teacherReportPeriod()" 
                                (change)="teacherReportPeriod.set($any($event.target).value)"
                                class="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm">
                          <option value="week">Xem theo Tuần</option>
                          <option value="month">Xem theo Tháng</option>
                          <option value="semester">Xem theo Học kỳ</option>
                          <option value="year">Xem theo Năm học</option>
                        </select>
                        <mat-icon class="text-sm absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</mat-icon>
                      </div>

                      <!-- Specific Period Selector (Mock) -->
                      <div class="relative">
                        <select class="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm min-w-[140px]">
                          @if (teacherReportPeriod() === 'week') {
                            <option>Tuần này</option>
                            <option>Tuần trước</option>
                            <option>Tuần 10</option>
                            <option>Tuần 9</option>
                          } @else if (teacherReportPeriod() === 'month') {
                            <option>Tháng 3</option>
                            <option>Tháng 2</option>
                            <option>Tháng 1</option>
                            <option>Tháng 12</option>
                          } @else if (teacherReportPeriod() === 'semester') {
                            <option>Học kỳ I</option>
                            <option>Học kỳ II</option>
                          } @else {
                            <option>2025-2026</option>
                            <option>2024-2025</option>
                          }
                        </select>
                        <mat-icon class="text-sm absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</mat-icon>
                      </div>
                    </div>
                  </div>

                  <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table class="w-full text-sm text-left">
                      <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-xs">
                        <tr>
                          <th class="px-4 py-3 border-b border-slate-200 w-16 text-center">STT</th>
                          <th class="px-4 py-3 border-b border-slate-200">Họ và tên</th>
                          <th class="px-4 py-3 border-b border-slate-200 text-center">Tổng số ngày học</th>
                          <th class="px-4 py-3 border-b border-slate-200 text-center text-emerald-600">Có mặt</th>
                          <th class="px-4 py-3 border-b border-slate-200 text-center text-amber-600">Trễ giờ</th>
                          <th class="px-4 py-3 border-b border-slate-200 text-center text-rose-600">Vắng KP</th>
                          <th class="px-4 py-3 border-b border-slate-200 text-center text-blue-600">Vắng CP</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 bg-white">
                        @for (student of students(); track student.id; let i = $index) {
                          <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-4 py-3 text-center text-slate-500 font-mono">{{ i + 1 }}</td>
                            <td class="px-4 py-3 font-medium text-slate-900">{{ student.name }}</td>
                            <!-- Mock data changes based on period selection -->
                            @if (teacherReportPeriod() === 'week') {
                              <td class="px-4 py-3 text-center font-bold text-slate-700">5</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">4</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">1</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">0</td>
                            } @else if (teacherReportPeriod() === 'month') {
                              <td class="px-4 py-3 text-center font-bold text-slate-700">22</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">20</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">1</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">1</td>
                            } @else if (teacherReportPeriod() === 'semester') {
                              <td class="px-4 py-3 text-center font-bold text-slate-700">90</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">85</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">3</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">2</td>
                            } @else {
                              <td class="px-4 py-3 text-center font-bold text-slate-700">120</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">113</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">5</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">2</td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- PARENT VIEWS -->
              @case ('parent_attendance') {
                <div class="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-emerald-600 font-bold">visibility</mat-icon>
                      <h3 class="text-lg font-black text-slate-900 uppercase tracking-tight">Trạng thái điểm danh</h3>
                    </div>
                    <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm w-fit mt-2">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Xem ngày</span>
                      <input type="date" [value]="parentViewDate()" (input)="parentViewDate.set($any($event.target).value)" class="text-sm font-bold text-slate-900 outline-none bg-transparent border-none p-0 focus:ring-0">
                    </div>
                  </div>
                  <div class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-widest self-start sm:self-center">
                    Thời gian thực
                  </div>
                </div>
                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Morning -->
                  <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-amber-300 transition-all group">
                    <div class="flex items-center gap-6">
                      <!-- Custom Morning Icon -->
                      <div class="w-24 h-24 flex-shrink-0 rounded-full bg-gradient-to-b from-amber-50 to-emerald-50 border-4 border-white shadow-md relative overflow-hidden">
                        <!-- Sun -->
                        <div class="absolute top-4 left-4 w-8 h-8 rounded-full bg-amber-400 shadow-lg shadow-amber-200"></div>
                        <!-- Rays -->
                        <div class="absolute top-2 left-2 w-12 h-12 flex items-center justify-center animate-spin-slow opacity-50">
                          <mat-icon class="text-amber-300 text-5xl scale-150">wb_sunny</mat-icon>
                        </div>
                        <!-- Hill -->
                        <div class="absolute bottom-0 right-0 w-20 h-12 bg-emerald-400 rounded-tl-[40px] opacity-80"></div>
                        <div class="absolute bottom-0 right-[-10px] w-16 h-8 bg-emerald-500 rounded-tl-[30px]"></div>
                        <!-- Cloud -->
                        <div class="absolute top-3 right-2 text-white opacity-80">
                          <mat-icon class="text-3xl">cloud</mat-icon>
                        </div>
                      </div>

                      <div class="flex-grow">
                        <div class="flex items-center justify-between mb-2">
                          <div class="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Buổi sáng
                          </div>
                          @let mStatus = myChildData()?.morningStatus;
                          <div class="text-xs font-bold text-slate-400">
                            {{ mStatus === 'unmarked' ? 'Dự kiến: 07:30' : 'Ghi nhận: 07:15' }}
                          </div>
                        </div>
                        
                        <div class="text-3xl font-black tracking-tight mb-1"
                             [ngClass]="{
                               'text-emerald-600': mStatus === 'present',
                               'text-amber-600': mStatus === 'late',
                               'text-blue-600': mStatus === 'excused',
                               'text-rose-600': mStatus === 'unexcused',
                               'text-slate-400': mStatus === 'unmarked'
                             }">
                          {{ mStatus === 'present' ? 'CÓ MẶT' : 
                             mStatus === 'late' ? 'ĐI TRỄ' : 
                             mStatus === 'excused' ? 'CÓ PHÉP' : 
                             mStatus === 'unexcused' ? 'KHÔNG PHÉP' : 'CHƯA CÓ' }}
                        </div>
                        <div class="text-xs font-medium text-slate-500">
                          {{ mStatus === 'present' ? 'Đến lớp đúng giờ' : 
                             mStatus === 'late' ? 'Đến lớp muộn' : 
                             mStatus === 'excused' ? 'Đã xin phép nghỉ' : 
                             mStatus === 'unexcused' ? 'Vắng không lý do' : 'Chưa có dữ liệu' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Afternoon -->
                  <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-sky-300 transition-all group">
                    <div class="flex items-center gap-6">
                      <!-- Custom Afternoon Icon -->
                      <div class="w-24 h-24 flex-shrink-0 rounded-full bg-gradient-to-b from-sky-100 to-blue-50 border-4 border-white shadow-md relative overflow-hidden">
                        <!-- Sun -->
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose-500 shadow-lg shadow-rose-200 z-10"></div>
                        <!-- Rays -->
                        <div class="absolute inset-0 flex items-center justify-center">
                           <div class="w-16 h-1 bg-rose-400 rounded-full absolute rotate-0"></div>
                           <div class="w-16 h-1 bg-rose-400 rounded-full absolute rotate-45"></div>
                           <div class="w-16 h-1 bg-rose-400 rounded-full absolute rotate-90"></div>
                           <div class="w-16 h-1 bg-rose-400 rounded-full absolute rotate-135"></div>
                        </div>
                        <!-- Clouds -->
                        <div class="absolute top-2 right-[-5px] text-white opacity-60 scale-75">
                          <mat-icon class="text-4xl">cloud</mat-icon>
                        </div>
                        <div class="absolute bottom-2 left-[-5px] text-white opacity-60 scale-75">
                          <mat-icon class="text-4xl">cloud</mat-icon>
                        </div>
                      </div>

                      <div class="flex-grow">
                        <div class="flex items-center justify-between mb-2">
                          <div class="bg-sky-100 text-sky-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Buổi chiều
                          </div>
                          @let aStatus = myChildData()?.afternoonStatus;
                          <div class="text-xs font-bold text-slate-400">
                            {{ aStatus === 'unmarked' ? 'Dự kiến: 13:30' : 'Ghi nhận: 13:25' }}
                          </div>
                        </div>
                        
                        <div class="text-3xl font-black tracking-tight mb-1"
                             [ngClass]="{
                               'text-emerald-600': aStatus === 'present',
                               'text-amber-600': aStatus === 'late',
                               'text-blue-600': aStatus === 'excused',
                               'text-rose-600': aStatus === 'unexcused',
                               'text-slate-400': aStatus === 'unmarked'
                             }">
                          {{ aStatus === 'present' ? 'CÓ MẶT' : 
                             aStatus === 'late' ? 'ĐI TRỄ' : 
                             aStatus === 'excused' ? 'CÓ PHÉP' : 
                             aStatus === 'unexcused' ? 'KHÔNG PHÉP' : 'CHƯA CÓ' }}
                        </div>
                        <div class="text-xs font-medium text-slate-500">
                          {{ aStatus === 'present' ? 'Đến lớp đúng giờ' : 
                             aStatus === 'late' ? 'Đến lớp muộn' : 
                             aStatus === 'excused' ? 'Đã xin phép nghỉ' : 
                             aStatus === 'unexcused' ? 'Vắng không lý do' : 'Chưa có dữ liệu' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              @case ('parent_leave') {
                <div class="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <mat-icon class="text-amber-600">edit_note</mat-icon>
                      <h3 class="text-lg font-bold text-slate-900">Làm đơn xin phép</h3>
                    </div>
                    <p class="text-sm text-slate-500">Gửi đơn xin nghỉ học cho giáo viên chủ nhiệm</p>
                  </div>
                  
                  <!-- Internal Tabs -->
                  <div class="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
                    <button (click)="parentLeaveTab.set('form')" 
                            [class]="parentLeaveTab() === 'form' ? 'bg-blue-800 text-white shadow-lg scale-105' : 'text-slate-600 hover:bg-slate-300'"
                            class="px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider">
                      <mat-icon class="text-sm">add_circle</mat-icon> Làm đơn
                    </button>
                    <button (click)="parentLeaveTab.set('history')" 
                            [class]="parentLeaveTab() === 'history' ? 'bg-blue-800 text-white shadow-lg scale-105' : 'text-slate-600 hover:bg-slate-300'"
                            class="px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 uppercase tracking-wider">
                      <mat-icon class="text-sm">history</mat-icon> Lịch sử
                    </button>
                  </div>
                </div>

                <div class="p-6 bg-slate-100 flex-grow overflow-y-auto">
                  <div class="max-w-2xl mx-auto space-y-8">
                    @if (parentLeaveTab() === 'form') {
                      <!-- Leave Form Card (Redesigned to match detail view) -->
                      <div class="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <!-- Header -->
                        <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
                          <mat-icon class="text-blue-600">description</mat-icon>
                          <h3 class="font-bold text-slate-800 text-sm">Đơn xin nghỉ học</h3>
                        </div>

                        <div class="flex-grow">
                          <!-- Title -->
                          <div class="py-6 text-center">
                            <h2 class="text-lg font-black text-slate-900 uppercase tracking-tight">ĐƠN XIN PHÉP NGHỈ HỌC</h2>
                          </div>

                          <!-- Main Info Section -->
                          <div class="px-6 space-y-4 pb-6">
                            <div class="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                              <span class="font-bold text-slate-900">Kính gửi:</span>
                              <input type="text" [value]="recipient()" (input)="recipient.set($any($event.target).value)" 
                                     class="w-full border-b border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-slate-600">
                            </div>
                            <div class="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                              <span class="font-bold text-slate-900">Tôi tên là:</span>
                              <input type="text" [value]="parentName()" (input)="parentName.set($any($event.target).value)" 
                                     placeholder="Họ tên phụ huynh"
                                     class="w-full border-b border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-slate-600">
                            </div>
                            <div class="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                              <span class="font-bold text-slate-900">Phụ huynh em:</span>
                              <span class="text-blue-700 font-bold py-1">{{ myChild.name }}</span>
                            </div>
                            <div class="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                              <span class="font-bold text-slate-900">Lớp:</span>
                              <input type="text" [value]="className()" (input)="className.set($any($event.target).value)" 
                                     class="w-full border-b border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-slate-600">
                            </div>
                            <div class="grid grid-cols-[120px_1fr] gap-2 items-center text-sm">
                              <span class="font-bold text-slate-900">Số điện thoại:</span>
                              <input type="text" [value]="phoneNumber()" (input)="phoneNumber.set($any($event.target).value)" 
                                     placeholder="Số điện thoại liên hệ"
                                     class="w-full border-b border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-slate-600">
                            </div>
                          </div>

                          <!-- Date Section -->
                          <div class="px-6 py-4 bg-slate-50/30">
                            <h4 class="font-bold text-slate-900 text-sm mb-3">Gia đình xin phép cho con được nghỉ học ngày</h4>
                            <div class="flex items-center gap-4 mb-4">
                              <input type="date" [value]="leaveDate()" (input)="leaveDate.set($any($event.target).value)" 
                                     class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700">
                            </div>
                            <div class="space-y-3">
                              <div (click)="leaveMorning.set(!leaveMorning())" 
                                   (keyup.enter)="leaveMorning.set(!leaveMorning())"
                                   tabindex="0"
                                   role="checkbox"
                                   [attr.aria-checked]="leaveMorning()"
                                   class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group focus:outline-none">
                                <div class="w-5 h-5 border rounded flex items-center justify-center transition-colors"
                                     [class]="leaveMorning() ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'">
                                  @if (leaveMorning()) {
                                    <mat-icon class="text-white text-xs">check</mat-icon>
                                  }
                                </div>
                                <span class="group-hover:text-blue-600 transition-colors">Buổi sáng</span>
                              </div>
                              <div (click)="leaveAfternoon.set(!leaveAfternoon())" 
                                   (keyup.enter)="leaveAfternoon.set(!leaveAfternoon())"
                                   tabindex="0"
                                   role="checkbox"
                                   [attr.aria-checked]="leaveAfternoon()"
                                   class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer group focus:outline-none">
                                <div class="w-5 h-5 border rounded flex items-center justify-center transition-colors"
                                     [class]="leaveAfternoon() ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'">
                                  @if (leaveAfternoon()) {
                                    <mat-icon class="text-white text-xs">check</mat-icon>
                                  }
                                </div>
                                <span class="group-hover:text-blue-600 transition-colors">Buổi chiều</span>
                              </div>
                            </div>
                          </div>

                          <!-- Reason Section -->
                          <div class="px-6 py-4">
                            <h4 class="font-bold text-slate-900 text-sm mb-2">Lý do xin nghỉ</h4>
                            <input type="text" [value]="leaveReason()" (input)="leaveReason.set($any($event.target).value)" 
                                   placeholder="Ví dụ: Do sức khỏe (Bệnh sốt siêu vi)"
                                   class="w-full border-b border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-rose-600 font-bold text-sm mb-3">
                          </div>

                          <!-- Others Section -->
                          <div class="px-6 py-4">
                            <p class="text-sm text-slate-800 leading-relaxed">
                              Gia đình cam kết giúp cháu tự ôn tập, làm đầy đủ bài tập được giao trong thời gian nghỉ học.<br>
                              Trân trọng cảm ơn!
                            </p>
                          </div>
                        </div>

                        <!-- Footer Actions -->
                        <div class="p-6 bg-slate-50 border-t border-slate-100">
                          <button (click)="submitLeaveRequest()" class="w-full py-4 bg-blue-800 text-white rounded-xl font-black shadow-xl hover:bg-blue-900 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                            <mat-icon>send</mat-icon> Gửi đơn xin phép ngay
                          </button>
                        </div>
                      </div>
                    } @else {
                      <!-- Leave History Card -->
                      <div class="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                        <!-- Header -->
                        <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
                          <mat-icon class="text-blue-600">history</mat-icon>
                          <h3 class="font-bold text-slate-800 text-sm">Lịch sử gửi đơn</h3>
                          <span class="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {{ leaveRequests().length }}
                          </span>
                        </div>
                        
                        <div class="divide-y divide-slate-100">
                          @for (req of leaveRequests(); track req.id) {
                            <div (click)="selectedLeaveRequest.set(req)" 
                                 (keyup.enter)="selectedLeaveRequest.set(req)"
                                 tabindex="0"
                                 role="button"
                                 class="p-4 hover:bg-slate-50 transition-all cursor-pointer group flex items-center justify-between border-l-4 border-transparent hover:border-blue-600 focus:outline-none">
                              <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <mat-icon>description</mat-icon>
                                </div>
                                <div>
                                  <div class="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">Nghỉ ngày {{ req.date }}</div>
                                  <div class="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px] mt-0.5">"{{ req.reason }}"</div>
                                </div>
                              </div>
                              <div class="flex items-center gap-3">
                                <div [class]="req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'"
                                     class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                  {{ req.status === 'approved' ? 'Đã duyệt' : req.status === 'pending' ? 'Chờ duyệt' : 'Từ chối' }}
                                </div>
                                <mat-icon class="text-slate-300 group-hover:text-blue-600 text-sm">chevron_right</mat-icon>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
              @case ('parent_report') {
                <div class="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
                  <div class="flex items-center gap-2 mb-1">
                    <mat-icon class="text-blue-600">assessment</mat-icon>
                    <h3 class="text-lg font-bold text-slate-900">Báo cáo chuyên cần</h3>
                  </div>
                  <p class="text-sm text-slate-500">Thống kê tình hình học tập của {{ myChild.name }}</p>
                </div>
                <div class="p-6 space-y-8">
                  <!-- Summary Cards -->
                  <div>
                    <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Kết quả điểm danh của tuần</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                        <div class="text-2xl font-bold text-emerald-600">18</div>
                        <div class="text-xs text-emerald-500 mt-1">Số buổi có mặt</div>
                      </div>
                      <div (click)="openSummaryDetail('excused')" class="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center cursor-pointer hover:bg-blue-100 transition-colors group">
                        <div class="text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">2</div>
                        <div class="text-xs text-blue-500 mt-1 font-bold">Vắng có phép</div>
                        <div class="text-[10px] text-slate-400 mt-2 italic">Bấm xem chi tiết</div>
                      </div>
                      <div (click)="openSummaryDetail('unexcused')" class="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center cursor-pointer hover:bg-rose-100 transition-colors group">
                        <div class="text-2xl font-bold text-rose-600 group-hover:scale-110 transition-transform">0</div>
                        <div class="text-xs text-rose-500 mt-1 font-bold">Vắng không phép</div>
                        <div class="text-[10px] text-slate-400 mt-2 italic">Bấm xem chi tiết</div>
                      </div>
                      <div (click)="openSummaryDetail('late')" class="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center cursor-pointer hover:bg-amber-100 transition-colors group">
                        <div class="text-2xl font-bold text-amber-600 group-hover:scale-110 transition-transform">3</div>
                        <div class="text-xs text-amber-500 mt-1 font-bold">Số buổi đi trễ</div>
                        <div class="text-[10px] text-slate-400 mt-2 italic">Bấm xem chi tiết</div>
                      </div>
                    </div>
                  </div>

                  <!-- Detailed Table -->
                  <div>
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Chi tiết chuyên cần</h4>
                      <div class="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                        <button (click)="parentReportPeriod.set('month')" 
                                [class]="parentReportPeriod() === 'month' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">Tháng</button>
                        <button (click)="parentReportPeriod.set('semester')" 
                                [class]="parentReportPeriod() === 'semester' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">Học kỳ</button>
                        <button (click)="parentReportPeriod.set('year')" 
                                [class]="parentReportPeriod() === 'year' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all">Năm học</button>
                      </div>
                    </div>
                    
                    <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                      <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-xs">
                          <tr>
                            <th class="px-4 py-3 border-b border-slate-200 w-32 text-center">Thời gian</th>
                            <th class="px-4 py-3 border-b border-slate-200 text-center">Tổng ngày</th>
                            <th class="px-4 py-3 border-b border-slate-200 text-center text-emerald-600">Có mặt</th>
                            <th class="px-4 py-3 border-b border-slate-200 text-center text-amber-600">Trễ giờ</th>
                            <th class="px-4 py-3 border-b border-slate-200 text-center text-rose-600">Vắng KP</th>
                            <th class="px-4 py-3 border-b border-slate-200 text-center text-blue-600">Vắng CP</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                          @if (parentReportPeriod() === 'month') {
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Tháng 9</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">22</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">20</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">1</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">1</td>
                            </tr>
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Tháng 10</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">23</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">23</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">0</td>
                            </tr>
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Tháng 11</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">21</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">19</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">2</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">0</td>
                            </tr>
                          } @else if (parentReportPeriod() === 'semester') {
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Học kỳ I</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">90</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">85</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">3</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">2</td>
                            </tr>
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Học kỳ II</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">30</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">28</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">2</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">0</td>
                            </tr>
                          } @else {
                            <tr class="hover:bg-slate-50 transition-colors">
                              <td class="px-4 py-3 text-center font-bold text-slate-700">Năm học 2025-2026</td>
                              <td class="px-4 py-3 text-center font-bold text-slate-900">120</td>
                              <td class="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/50">113</td>
                              <td class="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/50">5</td>
                              <td class="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/50">0</td>
                              <td class="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/50">2</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }

              <!-- FALLBACK -->
              @default {
                <div class="flex-grow flex items-center justify-center flex-col text-slate-400 p-8 text-center">
                  <mat-icon class="text-6xl mb-4 text-slate-200">construction</mat-icon>
                  <h3 class="text-xl font-medium text-slate-600 mb-2">Tính năng đang phát triển</h3>
                  <p class="text-sm max-w-md">Vui lòng chọn "Điểm danh thủ công", "Quản lý đơn nghỉ" hoặc "Báo cáo" ở menu bên trái để trải nghiệm.</p>
                </div>
              }
            }
          </div>
        </div>
      </main>

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <mat-icon class="text-emerald-400">check_circle</mat-icon>
          <span class="font-medium">{{ toastMessage() }}</span>
        </div>
      }

      <!-- Save Success Modal -->
      @if (showSaveSuccessModal()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center relative">
            <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <mat-icon class="text-4xl text-emerald-600 scale-125">check_circle</mat-icon>
            </div>
            <h3 class="text-2xl font-black text-slate-900 mb-2">Lưu thành công!</h3>
            <p class="text-slate-500 mb-8">Dữ liệu điểm danh đã được cập nhật vào hệ thống.</p>
            <button (click)="closeSaveModal()" class="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
              Đóng
            </button>
          </div>
        </div>
      }

      <!-- Parent Summary Detail Modal -->
      @if (showSummaryDetail(); as type) {
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 class="font-bold text-slate-900 text-lg flex items-center gap-2">
                @if (type === 'late') {
                  <mat-icon class="text-amber-500">schedule</mat-icon> Chi tiết đi trễ
                } @else if (type === 'excused') {
                  <mat-icon class="text-blue-500">event_available</mat-icon> Chi tiết vắng có phép
                } @else if (type === 'unexcused') {
                  <mat-icon class="text-rose-500">event_busy</mat-icon> Chi tiết vắng không phép
                }
              </h3>
              <button (click)="showSummaryDetail.set(null)" class="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto">
              @if (type === 'late') {
                <div class="space-y-3">
                  <div class="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div class="font-bold text-slate-700 w-24">04/03/2026</div>
                    <div class="text-sm text-slate-600">Đi trễ 15 phút (07:45)</div>
                  </div>
                  <div class="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div class="font-bold text-slate-700 w-24">02/03/2026</div>
                    <div class="text-sm text-slate-600">Đi trễ 10 phút (07:40)</div>
                  </div>
                  <div class="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div class="font-bold text-slate-700 w-24">25/02/2026</div>
                    <div class="text-sm text-slate-600">Đi trễ 5 phút (07:35)</div>
                  </div>
                </div>
              } @else if (type === 'excused') {
                <div class="space-y-3">
                  <div class="flex items-start gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div class="font-bold text-slate-700 w-24 pt-0.5">09/04/2025</div>
                    <div>
                      <div class="text-sm font-bold text-blue-700 mb-1">Bệnh sốt siêu vi</div>
                      <div class="text-xs text-slate-500">Đã duyệt bởi GVCN</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div class="font-bold text-slate-700 w-24 pt-0.5">15/01/2026</div>
                    <div>
                      <div class="text-sm font-bold text-blue-700 mb-1">Việc gia đình</div>
                      <div class="text-xs text-slate-500">Đã duyệt bởi GVCN</div>
                    </div>
                  </div>
                </div>
              } @else if (type === 'unexcused') {
                <div class="flex flex-col items-center justify-center py-8 text-slate-400">
                  <mat-icon class="text-5xl mb-2 opacity-50">check_circle</mat-icon>
                  <p>Không có dữ liệu vắng không phép</p>
                </div>
              }
            </div>
            
            <div class="p-4 border-t border-slate-100 bg-slate-50">
              <button (click)="showSummaryDetail.set(null)" class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Global Modals -->
      <!-- Leave Request Detail Modal -->
      @if (selectedLeaveRequest(); as req) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
              <button (click)="selectedLeaveRequest.set(null)" class="p-1 hover:bg-slate-100 rounded-full transition-colors text-blue-600">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <h3 class="font-bold text-slate-800 text-sm">Đơn xin nghỉ học</h3>
            </div>

            <div class="flex-grow overflow-y-auto">
              <!-- Title -->
              <div class="py-6 text-center">
                <h2 class="text-lg font-black text-slate-900 uppercase tracking-tight">ĐƠN XIN PHÉP NGHỈ HỌC</h2>
              </div>

              <!-- Main Info Section -->
              <div class="px-6 space-y-3 pb-6">
                <div class="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span class="font-bold text-slate-900">Kính gửi:</span>
                  <span class="text-slate-600">{{ req.recipient }}</span>
                </div>
                <div class="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span class="font-bold text-slate-900">Tôi tên là:</span>
                  <span class="text-slate-600">{{ req.parentName }}</span>
                </div>
                <div class="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span class="font-bold text-slate-900">Phụ huynh em:</span>
                  <span class="text-slate-600">{{ req.studentName }}</span>
                </div>
                <div class="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span class="font-bold text-slate-900">Lớp:</span>
                  <span class="text-slate-600">{{ req.className || '10A1' }}</span>
                </div>
                <div class="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span class="font-bold text-slate-900">Số điện thoại:</span>
                  <span class="text-slate-600">{{ req.phoneNumber }}</span>
                </div>
              </div>

              <!-- Date Section -->
              <div class="px-6 py-4 bg-slate-50/30">
                <h4 class="font-bold text-slate-900 text-sm mb-3">Gia đình xin phép cho con được nghỉ học ngày</h4>
                <div class="space-y-2">
                  @if (req.morning !== false) {
                    <div class="flex items-center gap-3 text-sm text-slate-700">
                      <mat-icon class="text-blue-500 text-base">check</mat-icon>
                      <span>{{ req.date }} - Buổi sáng</span>
                    </div>
                  }
                  @if (req.afternoon !== false) {
                    <div class="flex items-center gap-3 text-sm text-slate-700">
                      <mat-icon class="text-blue-500 text-base">check</mat-icon>
                      <span>{{ req.date }} - Buổi chiều</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Reason Section -->
              <div class="px-6 py-4">
                <h4 class="font-bold text-slate-900 text-sm mb-2">Lý do xin nghỉ</h4>
                <p class="text-rose-600 font-bold text-sm mb-1">{{ req.reason }}</p>
              </div>

              <!-- Others Section -->
              <div class="px-6 py-4">
                <p class="text-sm text-slate-800 leading-relaxed">
                  Gia đình cam kết giúp cháu tự ôn tập, làm đầy đủ bài tập được giao trong thời gian nghỉ học.<br>
                  Trân trọng cảm ơn!
                </p>
                <div class="mt-4 text-xs text-slate-400">
                  Gửi lúc: <span class="font-medium">{{ req.submittedAt || '16:12, 04/03/2026' }}</span>
                </div>
              </div>

              <!-- Teacher Note Section (Only for Teacher or if note exists) -->
              @if (currentRole() === 'teacher' || req.teacherNote) {
                <div class="px-6 py-4 bg-slate-50">
                  <h4 class="font-bold text-slate-900 text-sm mb-3">Ghi chú của giáo viên/giám thị</h4>
                  @if (currentRole() === 'teacher' && req.status === 'pending') {
                    <textarea [value]="teacherNoteInput()" (input)="teacherNoteInput.set($any($event.target).value)"
                              placeholder="Nhập ghi chú của giáo viên..."
                              class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[80px]"></textarea>
                  } @else {
                    <div class="p-3 bg-white border border-slate-100 rounded-lg text-sm text-slate-600 italic">
                      {{ req.teacherNote || 'Không có ghi chú' }}
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Footer Actions -->
            <div class="p-4 bg-white border-t border-slate-100">
              @if (currentRole() === 'teacher' && req.status === 'pending') {
                <div class="grid grid-cols-2 gap-3">
                  <button (click)="updateLeaveStatus(req.id, 'rejected')" 
                          class="py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors text-sm">
                    Từ chối duyệt đơn
                  </button>
                  <button (click)="updateLeaveStatus(req.id, 'approved')" 
                          class="py-3 bg-blue-800 text-white rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-blue-800/20 text-sm">
                    Duyệt đơn
                  </button>
                </div>
              } @else {
                <button (click)="selectedLeaveRequest.set(null)" class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm">
                  Đóng
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Past Edit Success Modal -->
      @if (showPastEditModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <mat-icon class="text-3xl">history_edu</mat-icon>
            </div>
            <h3 class="text-xl font-black text-slate-900 mb-2">Đã cập nhật quá khứ!</h3>
            <p class="text-slate-600 mb-6">
              Hệ thống đã lưu log chỉnh sửa và gửi thông báo đến Ban Giám Hiệu, Phụ huynh và Học sinh.
            </p>
            <button (click)="showPastEditModal.set(false)" class="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Đóng
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class App {
  // State
  currentRole = signal<'teacher' | 'parent' | 'board' | 'student'>('teacher');
  currentSession = signal<'morning' | 'afternoon'>('morning');
  currentDate = signal<string>(new Date().toISOString().split('T')[0]);
  activeView = signal<string>('attendance');
  selectedFilter = signal<string>('all');
  showToast = signal<boolean>(false);
  toastMessage = signal<string>('');
  selectedLeaveRequest = signal<LeaveRequest | null>(null);

  // Formatted date for display: Thứ - Ngày - Tháng - Năm
  formattedDate = computed(() => {
    const date = new Date(this.currentDate());
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${dayName} - ${d}/${m}/${y}`;
  });

  // Teacher Actions
  teacherNoteInput = signal<string>('');

  updateLeaveStatus(reqId: string, status: 'approved' | 'rejected') {
    this.leaveRequests.update(requests => 
      requests.map(r => r.id === reqId ? { ...r, status, teacherNote: this.teacherNoteInput() } : r)
    );
    this.selectedLeaveRequest.set(null);
    this.teacherNoteInput.set('');
    this.showToast.set(true);
    this.toastMessage.set(status === 'approved' ? 'Đã duyệt đơn nghỉ học' : 'Đã từ chối đơn nghỉ học');
    setTimeout(() => this.showToast.set(false), 3000);
  }

  openLeaveDetail(req: LeaveRequest) {
    this.selectedLeaveRequest.set(req);
    this.teacherNoteInput.set(req.teacherNote || '');
  }

  openSummaryDetail(type: 'late' | 'excused' | 'unexcused') {
    this.showSummaryDetail.set(type);
  }

  // Parent Form State
  parentName = signal<string>('');
  recipient = signal<string>('Ban giám hiệu nhà trường, Thầy cô chủ nhiệm, bộ môn');
  phoneNumber = signal<string>('');
  leaveDate = signal<string>(new Date().toISOString().split('T')[0]);
  leaveMorning = signal<boolean>(true);
  leaveAfternoon = signal<boolean>(true);
  leaveReason = signal<string>('');
  leaveNote = signal<string>('');
  className = signal<string>('10A1');
  parentLeaveTab = signal<'form' | 'history'>('form');
  parentViewDate = signal<string>(new Date().toISOString().split('T')[0]);
  parentReportPeriod = signal<'month' | 'semester' | 'year'>('month');
  teacherReportPeriod = signal<'week' | 'month' | 'semester' | 'year'>('month');
  teacherLeaveTab = signal<'pending' | 'history'>('pending');
  teacherLeaveDate = signal<string>(new Date().toISOString().split('T')[0]);
  recognitionDate = signal<string>(new Date().toISOString().split('T')[0]);
  showSummaryDetail = signal<'late' | 'excused' | 'unexcused' | null>(null);

  recognitionHistory = signal<any[]>([
    { id: 'REC001', studentId: 'HS004', studentName: 'Phạm Thị Dung', time: '07:10', date: '04/03/2026', status: 'success', confidence: 0.98 },
    { id: 'REC002', studentId: 'HS001', studentName: 'Nguyễn Văn An', time: '07:15', date: '04/03/2026', status: 'success', confidence: 0.96 },
    { id: 'REC003', studentId: 'HS006', studentName: 'Vũ Thị Phương', time: '07:20', date: '04/03/2026', status: 'success', confidence: 0.99 },
    { id: 'REC004', studentId: 'HS002', studentName: 'Trần Thị Bình', time: '07:45', date: '04/03/2026', status: 'late', confidence: 0.92 },
    { id: 'REC005', studentId: 'HS003', studentName: 'Lê Hoàng Cường', time: '07:50', date: '03/03/2026', status: 'late', confidence: 0.88 },
  ]);

  filteredRecognitionHistory = computed(() => {
    const dateStr = this.recognitionDate();
    // Convert yyyy-mm-dd to dd/mm/yyyy
    const [y, m, d] = dateStr.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    
    // For demo purposes, if date matches 04/03/2026, show the mock data for that day
    // In a real app, this would filter by date
    return this.recognitionHistory().filter(rec => rec.date === formattedDate || (formattedDate === '04/03/2026' && rec.date === '04/03/2026'));
  });

  notifications = signal<AppNotification[]>([
    {
      id: 'N001',
      title: 'Hệ thống',
      message: 'Chào mừng Thầy/Cô đến với hệ thống điểm danh thông minh.',
      time: '07:00, 04/03/2026',
      read: true,
      type: 'system'
    }
  ]);

  unreadNotificationsCount = computed(() => this.notifications().filter(n => !n.read).length);
  showNotifications = signal<boolean>(false);

  markNotificationsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  toggleNotifications() {
    if (this.currentRole() === 'teacher') {
      this.showNotifications.set(!this.showNotifications());
      if (this.showNotifications()) {
        this.markNotificationsRead();
      }
    }
  }

  // Mock data for parent's child
  myChild = { id: 'HS001', name: 'Nguyễn Văn An' };
  myChildData = computed(() => this.students().find(s => s.id === this.myChild.id));

  menuCards = computed<MenuCard[]>(() => {
    const role = this.currentRole();
    
    if (role === 'teacher') {
      return [
        {
          id: 'face_registration',
          title: 'Đăng ký khuôn mặt',
          icon: 'face_retouching_natural',
          colorClass: 'bg-blue-100',
          iconColorClass: 'text-blue-600'
        },
        {
          id: 'recognition_history',
          title: 'Lịch sử nhận diện',
          icon: 'history',
          colorClass: 'bg-purple-100',
          iconColorClass: 'text-purple-600'
        },
        {
          id: 'attendance',
          title: 'Điểm danh thủ công',
          icon: 'fact_check',
          colorClass: 'bg-indigo-100',
          iconColorClass: 'text-indigo-600'
        },
        {
          id: 'leave_requests',
          title: 'Quản lý đơn nghỉ',
          icon: 'mark_email_unread',
          colorClass: 'bg-sky-100',
          iconColorClass: 'text-sky-600'
        },
        {
          id: 'reports',
          title: 'Báo cáo / Xuất dữ liệu',
          icon: 'analytics',
          colorClass: 'bg-cyan-100',
          iconColorClass: 'text-cyan-600'
        }
      ];
    } else if (role === 'board') {
      return [
        {
          id: 'ai_attendance',
          title: 'Tình trạng điểm danh AI',
          icon: 'camera_front',
          colorClass: 'bg-indigo-100',
          iconColorClass: 'text-indigo-600'
        },
        {
          id: 'reports',
          title: 'Xem báo cáo chuyên cần',
          icon: 'analytics',
          colorClass: 'bg-cyan-100',
          iconColorClass: 'text-cyan-600'
        },
        {
          id: 'leave_requests',
          title: 'Báo cáo đơn nghỉ',
          icon: 'assignment',
          colorClass: 'bg-sky-100',
          iconColorClass: 'text-sky-600'
        }
      ];
    } else {
      // Parent and Student share the same menu
      return [
        {
          id: 'parent_attendance',
          title: 'Trạng thái điểm danh',
          icon: 'visibility',
          colorClass: 'bg-emerald-100',
          iconColorClass: 'text-emerald-600'
        },
        {
          id: 'parent_leave',
          title: 'Làm đơn xin phép',
          icon: 'edit_note',
          colorClass: 'bg-amber-100',
          iconColorClass: 'text-amber-600'
        },
        {
          id: 'parent_report',
          title: 'Báo cáo chuyên cần',
          icon: 'assessment',
          colorClass: 'bg-blue-100',
          iconColorClass: 'text-blue-600'
        }
      ];
    }
  });

  students = signal<Student[]>([
    { id: 'HS001', name: 'Nguyễn Văn An', morningStatus: 'present', afternoonStatus: 'excused', note: '' },
    { id: 'HS002', name: 'Trần Thị Bình', morningStatus: 'late', afternoonStatus: 'present', note: 'Kẹt xe' },
    { id: 'HS003', name: 'Lê Hoàng Cường', morningStatus: 'excused', afternoonStatus: 'excused', note: 'Sốt xuất huyết' },
    { id: 'HS004', name: 'Phạm Thị Dung', morningStatus: 'present', afternoonStatus: 'present', note: '' },
    { id: 'HS005', name: 'Hoàng Văn Em', morningStatus: 'unmarked', afternoonStatus: 'unmarked', note: '' },
    { id: 'HS006', name: 'Vũ Thị Phương', morningStatus: 'present', afternoonStatus: 'present', note: '' },
  ]);

  leaveRequests = signal<LeaveRequest[]>([
    {
      id: 'LR001',
      studentName: 'Hoàng Lê Anh Đức',
      parentName: 'Phạm Phương Liên',
      phoneNumber: '0901234567',
      recipient: 'Ban giám hiệu nhà trường, Thầy cô chủ nhiệm, bộ môn',
      date: '09/04/2025',
      reason: 'Do sức khỏe (Bệnh sốt siêu vi)',
      status: 'pending',
      submittedAt: '16:12, 09/04/2025',
      className: '5C',
      teacherNote: '',
      morning: true,
      afternoon: true,
      note: 'do con bị ốm'
    },
    {
      id: 'LR002',
      studentName: 'Nguyễn Văn An',
      parentName: 'Nguyễn Văn Bình',
      phoneNumber: '0908887776',
      recipient: 'Ban Giám hiệu trường...',
      date: '03/03/2026',
      reason: 'Gia đình có việc bận đột xuất',
      status: 'approved',
      teacherNote: 'Đã nhận thông tin, con nhớ chép bài đầy đủ nhé.',
      submittedAt: '08:00, 03/03/2026',
      className: '10A1',
      morning: true,
      afternoon: false,
      note: 'Gia đình có việc riêng'
    }
  ]);

  // Computed properties for stats (based on current session)
  presentCount = computed(() => this.students().filter(s => (this.currentSession() === 'morning' ? s.morningStatus : s.afternoonStatus) === 'present').length);
  lateCount = computed(() => this.students().filter(s => (this.currentSession() === 'morning' ? s.morningStatus : s.afternoonStatus) === 'late').length);
  excusedCount = computed(() => this.students().filter(s => (this.currentSession() === 'morning' ? s.morningStatus : s.afternoonStatus) === 'excused').length);
  unexcusedCount = computed(() => this.students().filter(s => (this.currentSession() === 'morning' ? s.morningStatus : s.afternoonStatus) === 'unexcused').length);
  unmarkedCount = computed(() => this.students().filter(s => (this.currentSession() === 'morning' ? s.morningStatus : s.afternoonStatus) === 'unmarked').length);

  // Computed property for filtered students
  filteredStudents = computed(() => {
    const filter = this.selectedFilter();
    const session = this.currentSession();
    let list = [...this.students()]; // Copy array
    
    // 1. Filter
    if (filter !== 'all') {
      list = list.filter(s => (session === 'morning' ? s.morningStatus : s.afternoonStatus) === filter);
    }
    
    // 2. Sort: Unmarked first
    list.sort((a, b) => {
      const statusA = session === 'morning' ? a.morningStatus : a.afternoonStatus;
      const statusB = session === 'morning' ? b.morningStatus : b.afternoonStatus;
      
      if (statusA === 'unmarked' && statusB !== 'unmarked') return -1;
      if (statusA !== 'unmarked' && statusB === 'unmarked') return 1;
      return a.name.localeCompare(b.name); // Secondary sort by name
    });
    
    return list;
  });

  filteredTeacherLeaveRequests = computed(() => {
    const tab = this.teacherLeaveTab();
    const dateStr = this.teacherLeaveDate();
    // Convert yyyy-mm-dd to dd/mm/yyyy
    const [y, m, d] = dateStr.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    return this.leaveRequests().filter(req => {
      const statusMatch = tab === 'pending' ? req.status === 'pending' : req.status !== 'pending';
      const dateMatch = req.date === formattedDate;
      return statusMatch && dateMatch;
    });
  });

  pendingLeaveCount = computed(() => this.leaveRequests().filter(r => r.status === 'pending').length);

  showSaveSuccessModal = signal<boolean>(false);
  showPastEditModal = signal<boolean>(false);

  // Actions
  toggleRole() {
    const roles: ('teacher' | 'parent' | 'board' | 'student')[] = ['teacher', 'parent', 'board', 'student'];
    const currentIndex = roles.indexOf(this.currentRole());
    const newRole = roles[(currentIndex + 1) % roles.length];
    
    this.currentRole.set(newRole);
    
    // Reset view when role changes
    if (newRole === 'teacher') {
      this.activeView.set('attendance');
    } else if (newRole === 'parent' || newRole === 'student') {
      this.activeView.set('parent_attendance');
    } else if (newRole === 'board') {
      this.activeView.set('ai_attendance');
    }
  }

  setActiveView(id: string) {
    this.activeView.set(id);
  }

  viewLateStudents() {
    this.selectedFilter.set('late');
    this.activeView.set('attendance');
  }

  viewLeaveRequests() {
    this.teacherLeaveDate.set(this.currentDate());
    this.activeView.set('leave_requests');
  }

  viewUnrecognized() {
    this.recognitionDate.set(this.currentDate());
    this.activeView.set('recognition_history');
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentDate.set(input.value);
  }

  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedFilter.set(select.value);
  }

  updateStudentStatus(id: string, session: 'morning' | 'afternoon', newStatus: Student['morningStatus']) {
    this.students.update(students => 
      students.map(s => {
        if (s.id === id) {
          return session === 'morning' 
            ? { ...s, morningStatus: newStatus } 
            : { ...s, afternoonStatus: newStatus };
        }
        return s;
      })
    );
  }

  saveAttendance() {
    const today = new Date().toISOString().split('T')[0];
    if (this.currentDate() < today) {
      // Past date logic
      this.showPastEditModal.set(true);
    } else {
      this.showSaveSuccessModal.set(true);
    }
  }

  closeSaveModal() {
    this.showSaveSuccessModal.set(false);
    this.showToast.set(true);
    this.toastMessage.set('Đã lưu dữ liệu điểm danh thành công!');
    setTimeout(() => this.showToast.set(false), 3000);
  }

  submitLeaveRequest() {
    if (!this.parentName() || !this.leaveReason() || !this.phoneNumber()) {
      this.showToast.set(true);
      this.toastMessage.set('Vui lòng điền đầy đủ thông tin');
      setTimeout(() => this.showToast.set(false), 3000);
      return;
    }

    const newRequest: LeaveRequest = {
      id: `LR00${this.leaveRequests().length + 1}`,
      studentName: this.myChild.name,
      parentName: this.parentName(),
      phoneNumber: this.phoneNumber(),
      recipient: this.recipient(),
      date: this.leaveDate().split('-').reverse().join('/'),
      reason: this.leaveReason(),
      status: 'pending',
      submittedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + this.formattedDate(),
      className: this.className(),
      morning: this.leaveMorning(),
      afternoon: this.leaveAfternoon(),
      note: this.leaveNote(),
      teacherNote: ''
    };

    this.leaveRequests.update(list => [newRequest, ...list]);
    
    // Add notification for teacher
    const newNotification: AppNotification = {
      id: `N00${this.notifications().length + 1}`,
      title: 'Đơn xin nghỉ học mới',
      message: `Phụ huynh em ${newRequest.studentName} vừa gửi đơn xin nghỉ ngày ${newRequest.date}.`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ', ' + this.formattedDate(),
      read: false,
      type: 'leave_request'
    };
    this.notifications.update(list => [newNotification, ...list]);
    
    // Reset form
    this.leaveReason.set('');
    this.leaveNote.set('');
    
    this.showToast.set(true);
    this.toastMessage.set('Đơn xin nghỉ đã được gửi thành công');
    setTimeout(() => this.showToast.set(false), 3000);
    this.activeView.set('parent_attendance');
  }
}
