'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">개인정보 처리방침</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-400">
            시행일 2025.12.25
          </p>

          {/* 서문 */}
          <section className="mt-8">
            <p>
              SideDish(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
              이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을
              수립·공개합니다.
            </p>
          </section>

          {/* 1. 개인정보의 처리 목적 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">1. 개인정보의 처리 목적</h2>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>

            <h3 className="text-lg font-semibold mt-4">가. 회원 가입 및 관리</h3>
            <p>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적으로 개인정보를 처리합니다.</p>

            <h3 className="text-lg font-semibold mt-4">나. 서비스 제공</h3>
            <p>사이드 프로젝트 등록 및 공유, 댓글 및 귓속말(비공개 피드백) 기능 제공, AI 기반 콘텐츠 생성 서비스 제공, 맞춤형 서비스 제공을 목적으로 개인정보를 처리합니다.</p>

            <h3 className="text-lg font-semibold mt-4">다. 서비스 개선 및 통계 분석</h3>
            <p>서비스 이용 현황 분석, 신규 서비스 개발 및 기존 서비스 개선, 접속빈도 파악 등 통계적 분석을 목적으로 개인정보를 처리합니다.</p>

            <h3 className="text-lg font-semibold mt-4">라. 마케팅 및 광고 활용 (선택)</h3>
            <p>신규 기능 안내, 이벤트 및 프로모션 정보 제공 등 마케팅 활동을 목적으로 개인정보를 처리합니다. 단, 이는 정보주체의 별도 동의가 있는 경우에 한합니다.</p>
          </section>

          {/* 2. 개인정보의 처리 및 보유기간 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">2. 개인정보의 처리 및 보유기간</h2>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left">처리 목적</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">보유 기간</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">근거 법령</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">회원 가입 및 관리</td>
                    <td className="border border-slate-300 px-4 py-2">회원 탈퇴 시까지</td>
                    <td className="border border-slate-300 px-4 py-2">정보주체 동의</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">탈퇴 회원 정보</td>
                    <td className="border border-slate-300 px-4 py-2">탈퇴 후 1년</td>
                    <td className="border border-slate-300 px-4 py-2">분쟁 대응 및 법적 의무</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">서비스 이용 기록</td>
                    <td className="border border-slate-300 px-4 py-2">3년</td>
                    <td className="border border-slate-300 px-4 py-2">전자상거래법</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">접속 로그 기록</td>
                    <td className="border border-slate-300 px-4 py-2">3개월</td>
                    <td className="border border-slate-300 px-4 py-2">통신비밀보호법</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">마케팅 수신 동의 정보</td>
                    <td className="border border-slate-300 px-4 py-2">동의 철회 시까지</td>
                    <td className="border border-slate-300 px-4 py-2">정보주체 동의</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. 처리하는 개인정보의 항목 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">3. 처리하는 개인정보의 항목</h2>

            <h3 className="text-lg font-semibold mt-4">가. 필수 항목</h3>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left">수집 시점</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">수집 항목</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">수집 방법</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">소셜 로그인 시</td>
                    <td className="border border-slate-300 px-4 py-2">이메일, 소셜 ID (Google/GitHub UID)</td>
                    <td className="border border-slate-300 px-4 py-2">OAuth 연동</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">회원가입 완료 시</td>
                    <td className="border border-slate-300 px-4 py-2">닉네임 (2~20자)</td>
                    <td className="border border-slate-300 px-4 py-2">직접 입력</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">서비스 이용 시</td>
                    <td className="border border-slate-300 px-4 py-2">IP 주소, 접속 일시, 브라우저 정보</td>
                    <td className="border border-slate-300 px-4 py-2">자동 수집</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mt-6">나. 선택 항목</h3>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left">수집 시점</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">수집 항목</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">프로필 설정 시</td>
                    <td className="border border-slate-300 px-4 py-2">프로필 사진</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">프로젝트 등록 시</td>
                    <td className="border border-slate-300 px-4 py-2">프로젝트 이미지, GitHub URL, 웹사이트 URL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. 개인정보의 제3자 제공 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">4. 개인정보의 제3자 제공</h2>
            <p>회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
            <p className="mt-2">현재 회사는 정보주체의 개인정보를 제3자에게 제공하고 있지 않습니다.</p>
          </section>

          {/* 5. 개인정보 처리의 위탁 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">5. 개인정보 처리의 위탁</h2>
            <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>

            <h3 className="text-lg font-semibold mt-4">가. 국내 위탁</h3>
            <p className="text-slate-600 text-sm">해당 없음</p>

            <h3 className="text-lg font-semibold mt-4">나. 국외 이전</h3>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left">수탁업체</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">이전 국가</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">위탁 업무</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">이전 항목</th>
                    <th className="border border-slate-300 px-4 py-2 text-left">보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">Google LLC<br/>(Firebase)</td>
                    <td className="border border-slate-300 px-4 py-2">미국</td>
                    <td className="border border-slate-300 px-4 py-2">사용자 인증 및 데이터베이스 운영</td>
                    <td className="border border-slate-300 px-4 py-2">이메일, 닉네임, 프로필 사진, 서비스 이용 기록</td>
                    <td className="border border-slate-300 px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">Vercel Inc.</td>
                    <td className="border border-slate-300 px-4 py-2">미국</td>
                    <td className="border border-slate-300 px-4 py-2">이미지 파일 저장</td>
                    <td className="border border-slate-300 px-4 py-2">프로필 사진, 프로젝트 이미지</td>
                    <td className="border border-slate-300 px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-4 py-2">Google LLC<br/>(Gemini AI)</td>
                    <td className="border border-slate-300 px-4 py-2">미국</td>
                    <td className="border border-slate-300 px-4 py-2">AI 콘텐츠 생성</td>
                    <td className="border border-slate-300 px-4 py-2">프로젝트 초안 텍스트 (개인정보 미포함)</td>
                    <td className="border border-slate-300 px-4 py-2">처리 즉시 파기</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              위 수탁업체들은 개인정보 보호에 관한 적절한 안전장치를 갖추고 있으며, 회사는 위탁계약 체결 시
              「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치,
              재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고 있습니다.
            </p>
            <p className="mt-2 font-semibold">
              정보주체는 개인정보의 국외이전을 거부할 수 있습니다. 다만, 국외이전을 거부하실 경우 서비스 이용이
              제한될 수 있습니다. 거부를 원하시는 경우 개인정보 보호책임자에게 연락해 주시기 바랍니다.
            </p>
          </section>

          {/* 6. 개인정보의 파기절차 및 방법 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">6. 개인정보의 파기절차 및 방법</h2>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>

            <h3 className="text-lg font-semibold mt-4">가. 파기절차</h3>
            <p>불필요한 개인정보 및 개인정보파일은 개인정보보호책임자의 승인을 받아 파기합니다.</p>

            <h3 className="text-lg font-semibold mt-4">나. 파기방법</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>전자적 파일: 복원이 불가능한 방법으로 영구 삭제</li>
              <li>기록물, 인쇄물, 서면 등: 분쇄기로 파쇄 또는 소각</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">다. 회원 탈퇴 시 처리</h3>
            <p>회원 탈퇴 시 개인정보는 즉시 삭제되지 않고, 분쟁 대응 및 법적 의무 이행을 위해 탈퇴 후 1년간
            보관됩니다. 이 기간 동안 해당 정보는 보관 목적 외의 다른 목적으로 이용되지 않습니다.
            보관 기간 경과 후 해당 정보는 지체 없이 파기됩니다.</p>
          </section>

          {/* 7. 정보주체의 권리·의무 및 행사방법 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">7. 정보주체의 권리·의무 및 행사방법</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>

            <ol className="list-decimal pl-6 mt-4 space-y-2">
              <li>개인정보 열람요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제요구</li>
              <li>처리정지 요구</li>
            </ol>

            <h3 className="text-lg font-semibold mt-4">가. 권리 행사 방법</h3>
            <p>권리 행사는 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.</p>

            <h3 className="text-lg font-semibold mt-4">나. 대리인을 통한 행사</h3>
            <p>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를
            완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>

            <h3 className="text-lg font-semibold mt-4">다. 법정대리인의 권리</h3>
            <p>만 14세 미만 아동의 법정대리인은 아동의 개인정보에 대한 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.
            단, 본 서비스는 만 14세 미만 아동의 회원가입을 받지 않습니다.</p>
          </section>

          {/* 8. 개인정보의 안전성 확보조치 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">8. 개인정보의 안전성 확보조치</h2>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>

            <h3 className="text-lg font-semibold mt-4">가. 관리적 조치</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>개인정보 보호책임자 지정 및 운영</li>
              <li>개인정보 취급 직원의 최소화</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">나. 기술적 조치</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>개인정보의 암호화: 비밀번호 등 중요 데이터는 암호화하여 저장 및 관리</li>
              <li>해킹 등에 대비한 기술적 대책: 침입방지시스템 운영, 보안 프로그램 설치</li>
              <li>접근권한 관리: 개인정보에 대한 접근권한을 최소한의 인원으로 제한</li>
              <li>접속기록 보관: 개인정보처리시스템에 접속한 기록을 최소 1년 이상 보관·관리</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">다. 물리적 조치</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>클라우드 서비스(Firebase, Vercel) 이용으로 물리적 보안은 해당 서비스 제공자의 보안 정책을 따름</li>
            </ul>
          </section>

          {/* 9. 자동 수집 장치의 설치·운영 및 거부 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">9. 자동 수집 장치의 설치·운영 및 거부</h2>

            <h3 className="text-lg font-semibold mt-4">가. 쿠키의 사용 목적</h3>
            <p>회사는 이용자에게 더 나은 서비스를 제공하기 위하여 쿠키를 운영합니다. 쿠키란 웹사이트를 운영하는데
            이용되는 서버가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며, 이용자 PC의 하드디스크에 저장됩니다.</p>
            <ul className="list-disc pl-6 mt-2">
              <li>로그인 상태 유지</li>
              <li>서비스 이용 환경 설정 저장</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">나. 쿠키 설정 거부 방법</h3>
            <p>이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저에서 옵션을 설정함으로써
            모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.
            단, 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.</p>
          </section>

          {/* 10. 행태정보의 수집·이용 및 거부 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">10. 행태정보의 수집·이용 및 거부</h2>
            <p>회사는 현재 맞춤형 광고 제공을 위한 행태정보를 수집하고 있지 않습니다.</p>
          </section>

          {/* 11. AI 서비스 관련 개인정보 처리 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">11. AI 서비스 관련 개인정보 처리</h2>
            <p>회사는 프로젝트 설명 생성을 위해 Google Gemini AI 서비스를 활용합니다.</p>

            <h3 className="text-lg font-semibold mt-4">가. AI 학습 데이터 미사용</h3>
            <p>이용자가 입력한 프로젝트 초안 텍스트는 AI 모델 학습에 사용되지 않습니다.
            해당 데이터는 콘텐츠 생성 목적으로만 일시적으로 처리되며, 처리 완료 후 즉시 삭제됩니다.</p>

            <h3 className="text-lg font-semibold mt-4">나. 개인정보 미포함 권고</h3>
            <p>AI 콘텐츠 생성 시 개인정보(실명, 연락처, 주소 등)를 포함하지 않도록 권고드립니다.
            입력된 텍스트에 개인정보가 포함된 경우, 해당 정보가 생성된 콘텐츠에 반영될 수 있습니다.</p>
          </section>

          {/* 12. 개인정보 보호책임자 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">12. 개인정보 보호책임자</h2>
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
            불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>

            <div className="bg-slate-100 p-4 rounded-lg mt-4">
              <p className="font-semibold">개인정보 보호책임자</p>
              <ul className="mt-2 space-y-1">
                <li>담당자: SideDish 운영자</li>
                <li>이메일: contact@sidedish.me</li>
              </ul>
            </div>

            <p className="mt-4">정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리,
            피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해
            지체없이 답변 및 처리해드릴 것입니다.</p>
          </section>

          {/* 13. 권익침해 구제방법 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">13. 권익침해 구제방법</h2>
            <p>정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을 문의하실 수 있습니다.</p>

            <div className="space-y-4 mt-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="font-semibold">개인정보분쟁조정위원회</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>소관업무: 개인정보 분쟁조정신청, 집단분쟁조정(민사적 해결)</li>
                  <li>전화: 1833-6972</li>
                  <li>홈페이지: <a href="https://www.kopico.go.kr" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">www.kopico.go.kr</a></li>
                </ul>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="font-semibold">개인정보침해신고센터</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>소관업무: 개인정보 침해사실 신고, 상담 신청</li>
                  <li>전화: (국번없이) 118</li>
                  <li>홈페이지: <a href="https://privacy.kisa.or.kr" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">privacy.kisa.or.kr</a></li>
                </ul>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="font-semibold">대검찰청 사이버수사과</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>전화: (국번없이) 1301</li>
                  <li>홈페이지: <a href="https://www.spo.go.kr" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">www.spo.go.kr</a></li>
                </ul>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="font-semibold">경찰청 사이버수사국</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>전화: (국번없이) 182</li>
                  <li>홈페이지: <a href="https://ecrm.police.go.kr" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">ecrm.police.go.kr</a></li>
                </ul>
              </div>
            </div>
          </section>

          {/* 14. 개인정보 처리방침의 변경 */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">14. 개인정보 처리방침의 변경</h2>
            <p>이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이
            있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다. 다만, 이용자의 권리에
            중요한 변경이 있을 경우에는 최소 30일 전에 공지합니다.</p>

            <p className="text-sm text-slate-500 mt-4">
              개정 이력: 2025.12.25 최초 제정
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2025 SideDish. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/legal/terms" className="hover:text-indigo-600">서비스 이용약관</Link>
            <span>|</span>
            <Link href="/legal/privacy" className="text-indigo-600">개인정보 처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicyPage
