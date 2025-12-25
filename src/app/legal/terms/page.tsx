'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import {
  TERMS_DOCUMENT,
  formatVersionShort,
  getEffectiveDate,
} from '@/lib/legal-versions'

const TermsOfServicePage: React.FC = () => {
  const { currentVersion } = TERMS_DOCUMENT

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
          <h1 className="text-xl font-bold text-slate-900">서비스 이용약관</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-slate max-w-none">
          {/* 버전 정보 */}
          <div className="not-prose flex flex-wrap items-center gap-3 text-sm mb-6">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
              {formatVersionShort(currentVersion)}
            </span>
            <span className="text-slate-500">
              시행일 {getEffectiveDate(currentVersion)}
            </span>
            <Link
              href="/legal/history"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors ml-auto"
            >
              <History className="w-4 h-4" />
              <span>변경 이력</span>
            </Link>
          </div>

          {/* 제1장 총칙 */}
          <section className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제1장 총칙</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제1조 (목적)</h3>
            <p>
              이 약관은 SideDish(이하 &quot;운영자&quot;)가 제공하는 사이드 프로젝트 공유 플랫폼 서비스(이하 &quot;서비스&quot;)의
              이용과 관련하여 운영자와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제2조 (정의)</h3>
            <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                <strong>&quot;서비스&quot;</strong>란 운영자가 제공하는 사이드 프로젝트 등록, 공유, 소통 관련
                일체의 서비스를 의미합니다.
              </li>
              <li>
                <strong>&quot;회원&quot;</strong>이란 이 약관에 동의하고 운영자와 서비스 이용계약을 체결한 자를 의미합니다.
              </li>
              <li>
                <strong>&quot;비회원&quot;</strong>이란 회원으로 가입하지 않고 서비스를 이용하는 자를 의미합니다.
              </li>
              <li>
                <strong>&quot;프로젝트&quot;</strong>란 회원이 서비스 내에 등록하는 사이드 프로젝트 정보
                (제목, 설명, 이미지, 링크 등)를 의미합니다.
              </li>
              <li>
                <strong>&quot;콘텐츠&quot;</strong>란 회원이 서비스 내에 게시한 프로젝트, 댓글, 귓속말(비공개 피드백) 등
                일체의 정보를 의미합니다.
              </li>
              <li>
                <strong>&quot;AI 콘텐츠 생성&quot;</strong>이란 회원이 입력한 초안을 기반으로 인공지능이
                자동으로 프로젝트 설명을 생성하는 기능을 의미합니다.
              </li>
              <li>
                <strong>&quot;셰프(Chef)&quot;</strong>란 프로젝트를 등록한 회원을 의미합니다.
              </li>
              <li>
                <strong>&quot;다이너(Diner)&quot;</strong>란 프로젝트를 열람하는 회원을 의미합니다.
              </li>
              <li>
                <strong>&quot;유료 서비스&quot;</strong>란 운영자가 별도의 요금을 받고 제공하는 서비스를 의미합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제3조 (약관의 효력 및 변경)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
              <li>
                운영자는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
              </li>
              <li>
                운영자가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 적용일자 7일 전부터
                적용일자 전일까지 공지합니다. 다만, 회원에게 불리한 약관의 개정의 경우에는 30일 전부터 공지하며,
                전자우편 등으로 개별 통지합니다.
              </li>
              <li>
                회원이 개정약관의 적용에 동의하지 않는 경우 운영자 또는 회원은 서비스 이용계약을 해지할 수 있습니다.
                개정약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관의 변경사항에 동의한 것으로 봅니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제4조 (약관 외 준칙)</h3>
            <p>
              이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 「전자상거래 등에서의 소비자보호에 관한 법률」,
              「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령 및
              운영자가 정한 서비스의 세부 이용지침 등의 규정에 따릅니다.
            </p>
          </section>

          {/* 제2장 서비스 이용계약 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제2장 서비스 이용계약</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제5조 (이용계약의 성립)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                서비스 이용계약은 회원이 되고자 하는 자(이하 &quot;가입신청자&quot;)가 이 약관의 내용에 대하여 동의를 한 다음
                소셜 로그인(Google, GitHub)을 통해 가입신청을 하고, 운영자가 이를 승낙함으로써 체결됩니다.
              </li>
              <li>
                가입신청자는 반드시 본인의 소셜 계정으로 가입해야 하며, 타인의 정보를 도용하여 가입할 수 없습니다.
              </li>
              <li>
                가입신청자는 회원가입 완료 후 닉네임을 설정하고, 서비스 이용약관과 개인정보 처리방침에 동의해야
                서비스를 정상적으로 이용할 수 있습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제6조 (이용신청의 승낙과 제한)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 전조의 규정에 의한 가입신청에 대하여 특별한 사유가 없는 한 접수순서대로 이용신청을 승낙합니다.
              </li>
              <li>
                운영자는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나, 사후에 이용계약을 해지할 수 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>만 14세 미만인 경우</li>
                  <li>허위의 정보를 기재하거나, 필수 정보를 기재하지 않은 경우</li>
                  <li>이전에 회원자격을 상실한 적이 있는 경우 (단, 자격 상실 후 1년이 경과한 자로서 운영자의 재가입 승낙을 얻은 경우 예외)</li>
                  <li>기타 이 약관에 위배되거나 위법 또는 부당한 이용신청임이 확인된 경우</li>
                </ul>
              </li>
              <li>
                운영자는 서비스 관련 설비의 여유가 없거나, 기술상 또는 업무상 문제가 있는 경우에는 승낙을 유보할 수 있습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제7조 (회원정보의 변경)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 프로필 설정 화면을 통하여 언제든지 본인의 개인정보(닉네임, 프로필 사진)를 열람하고 수정할 수 있습니다.
              </li>
              <li>
                회원은 가입신청 시 기재한 사항이 변경되었을 경우 즉시 회원정보를 수정해야 하며, 수정하지 않아 발생한 불이익에 대해 운영자는 책임지지 않습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제7조의2 (닉네임 정책)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 서비스 이용 시 닉네임을 설정해야 하며, 다음에 해당하는 닉네임은 사용할 수 없습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>욕설, 비속어, 혐오 표현이 포함된 닉네임</li>
                  <li>타인을 사칭하거나 오해를 유발할 수 있는 닉네임</li>
                  <li>운영자, 관리자 등 운영진으로 오인될 수 있는 닉네임</li>
                  <li>개인정보(전화번호, 이메일 등)가 포함된 닉네임</li>
                  <li>광고, 홍보 목적의 닉네임</li>
                  <li>법령 또는 공서양속에 반하는 닉네임</li>
                </ul>
              </li>
              <li>
                닉네임은 2자 이상 20자 이하로 설정해야 하며, 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.
              </li>
              <li>
                부적절한 닉네임 사용 시 운영자는 사전 통지 없이 닉네임 변경을 요청하거나 서비스 이용을 제한할 수 있습니다.
              </li>
              <li>
                회원은 닉네임 변경이 가능하며, 변경된 닉네임에도 본 조의 규정이 적용됩니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제8조 (회원 탈퇴 및 자격 상실)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 언제든지 마이페이지에서 회원 탈퇴를 신청할 수 있으며, 운영자는 즉시 회원탈퇴를 처리합니다.
              </li>
              <li>
                회원 탈퇴 시 회원이 등록한 프로젝트와 댓글은 삭제되지 않으나, 작성자명이 &quot;탈퇴한 셰프&quot; 또는
                &quot;탈퇴한 사용자&quot;로 익명화됩니다.
              </li>
              <li>
                탈퇴한 회원의 개인정보는 분쟁 대응 및 법적 의무 이행을 위해 탈퇴 후 1년간 보관되며,
                이 기간이 경과하면 지체 없이 파기됩니다.
              </li>
              <li>
                회원이 다음 각 호의 사유에 해당하는 경우, 운영자는 회원자격을 제한 및 정지시킬 수 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>가입신청 시 허위 내용을 등록한 경우</li>
                  <li>다른 회원의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                  <li>서비스를 이용하여 법령 또는 이 약관이 금지하는 행위를 하는 경우</li>
                  <li>기타 운영자가 합리적인 판단에 기하여 서비스 제공을 거절할 필요가 있다고 인정하는 경우</li>
                </ul>
              </li>
              <li>
                운영자가 회원자격을 제한·정지하고자 하는 경우에는 그 사유, 일시 및 기간을 정하여 전자우편 등의
                방법으로 해당 회원에게 통지합니다. 다만, 긴급하게 이용을 정지할 필요가 있다고 인정하는 경우에는
                사후에 통지할 수 있습니다.
              </li>
              <li>
                회원은 본 조에 따른 이용제한에 대해 운영자가 정한 절차에 따라 이의신청을 할 수 있습니다.
                운영자는 이의가 정당하다고 인정하는 경우 즉시 서비스 이용을 재개합니다.
              </li>
              <li>
                탈퇴 후 30일 이내에는 동일한 소셜 계정으로 재가입이 제한될 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 제3장 서비스 이용 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제3장 서비스 이용</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제9조 (서비스의 제공)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 회원에게 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>사이드 프로젝트 등록 및 공유 서비스</li>
                  <li>AI 기반 프로젝트 설명 생성 서비스</li>
                  <li>프로젝트에 대한 댓글 및 귓속말(비공개 피드백) 서비스</li>
                  <li>프로젝트 좋아요 및 리액션 서비스</li>
                  <li>회원 프로필 관리 서비스</li>
                  <li>기타 운영자가 정하는 서비스</li>
                </ul>
              </li>
              <li>
                서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 운영자의 업무상 또는 기술상의 이유로
                서비스가 일시 중지될 수 있으며, 운영상의 목적으로 운영자가 정한 기간에는 서비스가 일시 중지될 수 있습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제10조 (서비스의 변경 및 중단)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다.
              </li>
              <li>
                운영자는 무료로 제공되는 서비스의 일부 또는 전부를 운영자의 정책 및 운영의 필요상 수정, 중단, 변경할 수 있으며,
                이에 대하여 관련법에 특별한 규정이 없는 한 회원에게 별도의 보상을 하지 않습니다.
              </li>
              <li>
                서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및
                제공일자 등을 그 변경 전 7일 이상 서비스 내 공지사항에 게시합니다. 다만, 회원에게 불리한 변경의 경우에는
                30일 전에 공지하며, 전자우편 등으로 개별 통지합니다.
              </li>
              <li>
                운영자가 서비스를 종료하고자 하는 경우에는 서비스 종료일로부터 30일 전에 서비스 내 공지사항에 게시하고,
                전자우편 등으로 회원에게 개별 통지합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제11조 (AI 콘텐츠 생성 서비스)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 Google Gemini AI를 활용하여 회원이 입력한 프로젝트 초안을 기반으로 프로젝트 설명을 자동 생성하는
                서비스를 제공합니다.
              </li>
              <li>
                AI 콘텐츠 생성 서비스는 다음과 같은 이용 제한이 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>프로젝트 초안당 최대 3회 생성 가능</li>
                  <li>회원당 1일 최대 10회 생성 가능</li>
                  <li>생성 요청 간 5초의 대기 시간 필요</li>
                </ul>
              </li>
              <li>
                AI가 생성한 콘텐츠의 정확성, 완전성, 적합성에 대해 운영자는 보증하지 않으며, 회원은 생성된 콘텐츠를
                검토하고 필요에 따라 수정하여 사용해야 합니다.
              </li>
              <li>
                AI 콘텐츠 생성을 위해 입력된 텍스트는 AI 모델 학습에 사용되지 않으며, 콘텐츠 생성 목적으로만
                일시적으로 처리됩니다.
              </li>
              <li>
                회원은 AI 콘텐츠 생성 시 개인정보, 저작권이 있는 콘텐츠, 불법적인 내용을 입력해서는 안 됩니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제12조 (유료 서비스)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 일부 서비스를 유료로 제공할 수 있으며, 유료 서비스를 이용하려는 회원은 해당 서비스에서
                정한 요금을 지불해야 합니다.
              </li>
              <li>
                유료 서비스의 종류, 이용요금, 이용기간, 결제방법 등은 해당 서비스 화면에 별도로 게시합니다.
              </li>
              <li>
                유료 서비스 이용 요금의 결제와 관련하여 회원이 입력한 정보 및 그 정보와 관련하여 발생한 책임과
                불이익은 전적으로 회원이 부담합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제13조 (청약철회 및 환불)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                유료 서비스를 이용하는 회원은 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령에 따라
                서비스 구매일 또는 이용가능일로부터 7일 이내에 청약을 철회할 수 있습니다.
              </li>
              <li>
                다음 각 호에 해당하는 경우에는 청약철회가 제한될 수 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>회원에게 책임이 있는 사유로 서비스 이용이 불가능하게 된 경우</li>
                  <li>서비스의 전부 또는 일부를 이용한 경우 (단, 일부 이용의 경우 이용한 부분에 해당하는 금액은 환불에서 제외)</li>
                  <li>디지털 콘텐츠의 경우 다운로드 또는 스트리밍이 시작된 경우</li>
                </ul>
              </li>
              <li>
                환불은 원칙적으로 결제수단과 동일한 방법으로 진행되며, 결제수단에 따라 3~7 영업일이 소요될 수 있습니다.
              </li>
              <li>
                운영자는 환불 신청을 접수한 날로부터 3 영업일 이내에 환불 처리를 완료합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제14조 (정보의 제공 및 광고의 게재)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 서비스 이용 중 필요하다고 인정되는 다양한 정보를 공지사항이나 전자우편 등의 방법으로
                회원에게 제공할 수 있습니다. 다만, 회원은 언제든지 수신 거절을 할 수 있습니다.
              </li>
              <li>
                운영자는 서비스 운영과 관련하여 서비스 화면에 광고를 게재할 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 제4장 콘텐츠 및 권리 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제4장 콘텐츠 및 권리</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제15조 (콘텐츠의 등록)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 서비스 내에 프로젝트, 댓글, 귓속말 등의 콘텐츠를 등록할 수 있습니다.
              </li>
              <li>
                회원이 등록한 콘텐츠에 대한 저작권 및 지적재산권은 해당 회원에게 귀속됩니다. 다만, 운영자는 서비스의 운영,
                개선, 홍보 등의 목적으로 회원의 콘텐츠를 무상으로 사용할 수 있습니다.
              </li>
              <li>
                프로젝트 등록 시 다음 사항을 준수해야 합니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>제목은 2자 이상 100자 이하로 작성</li>
                  <li>한 줄 소개는 80자 이하로 작성</li>
                  <li>상세 설명은 10,000자 이하로 작성</li>
                  <li>태그는 최대 5개까지 등록 가능</li>
                  <li>이미지는 5MB 이하, JPG/PNG/WebP/GIF 형식만 가능</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제16조 (콘텐츠의 관리)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원이 등록한 콘텐츠가 다음 각 호에 해당하는 경우, 운영자는 해당 콘텐츠를 삭제하거나 게시를 거부할 수 있으며,
                이에 대해 운영자는 별도의 보상을 하지 않습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>다른 회원 또는 제3자를 비방하거나 명예를 손상시키는 내용인 경우</li>
                  <li>공공질서 및 미풍양속에 위반되는 내용인 경우</li>
                  <li>범죄적 행위에 결부된다고 인정되는 내용인 경우</li>
                  <li>운영자 또는 제3자의 저작권 등 기타 권리를 침해하는 내용인 경우</li>
                  <li>음란물 또는 청소년에게 유해한 내용인 경우</li>
                  <li>서비스와 관련 없는 상업적 광고, 스팸성 콘텐츠인 경우</li>
                  <li>기타 관련 법령에 위반되거나 운영자가 정한 게시 원칙에 어긋나는 경우</li>
                </ul>
              </li>
              <li>
                회원은 본인이 등록한 콘텐츠를 언제든지 수정하거나 삭제할 수 있습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제17조 (저작권의 귀속)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                서비스 자체에 대한 저작권 및 지적재산권은 운영자에 귀속됩니다.
              </li>
              <li>
                회원은 서비스를 이용함으로써 얻은 정보를 운영자의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 기타 방법에
                의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
              </li>
              <li>
                회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다. 다만, 회원은 서비스 이용을 위하여
                필요한 범위 내에서 운영자에게 해당 콘텐츠를 사용, 복제, 수정, 배포할 수 있는 권리를 부여합니다.
              </li>
            </ol>
          </section>

          {/* 제5장 의무 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제5장 의무</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제18조 (운영자의 의무)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 관련 법령과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로
                서비스를 제공하기 위하여 최선을 다합니다.
              </li>
              <li>
                운영자는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보(신용정보 포함) 보호를 위해 보안시스템을
                갖추며, 개인정보 처리방침을 공시하고 준수합니다.
              </li>
              <li>
                운영자는 서비스 이용과 관련하여 회원으로부터 제기된 의견이나 불만이 정당하다고 인정될 경우 이를 처리하여야 합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제19조 (회원의 의무)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 다음 각 호의 행위를 하여서는 안 됩니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>가입신청 또는 변경 시 허위 내용 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>운영자가 게시한 정보의 변경</li>
                  <li>운영자가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시</li>
                  <li>운영자 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>운영자 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                  <li>서비스의 안정적 운영에 지장을 주거나 줄 우려가 있는 일체의 행위</li>
                  <li>서비스를 상업적 목적으로 이용하거나 부정하게 이용하는 행위</li>
                </ul>
              </li>
              <li>
                회원은 관련 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 운영자가 통지하는 사항 등을
                준수하여야 하며, 기타 운영자의 업무에 방해되는 행위를 하여서는 안 됩니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제20조 (회원의 계정 관리)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                회원은 소셜 로그인(Google, GitHub) 계정을 통해 서비스에 접속하며, 해당 소셜 계정의 보안은
                회원 본인의 책임입니다.
              </li>
              <li>
                회원은 자신의 계정이 부정하게 사용된 것을 발견한 경우 즉시 운영자에 통보해야 합니다.
              </li>
              <li>
                계정의 부정 사용으로 인해 발생한 손해에 대해 운영자는 책임지지 않습니다.
              </li>
            </ol>
          </section>

          {/* 제6장 손해배상 및 면책 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">제6장 손해배상 및 면책</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제21조 (손해배상)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자가 회원에게 손해를 입힌 경우 운영자는 그 손해를 배상합니다. 다만, 운영자가 고의 또는 과실이 없음을
                입증하는 경우에는 그러하지 않습니다.
              </li>
              <li>
                회원이 이 약관을 위반하여 운영자에 손해를 입힌 경우 해당 회원은 운영자에 그 손해를 배상해야 합니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제22조 (운영자의 면책)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 천재지변, 전쟁, 기간통신사업자의 서비스 중지, 제3자가 제공하는 오픈 API 장애, 기타 불가항력으로
                인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.
              </li>
              <li>
                운영자는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
              </li>
              <li>
                운영자는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖에
                서비스를 통해 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </li>
              <li>
                운영자는 회원이 게시 또는 전송한 콘텐츠의 내용에 대해서는 책임을 지지 않습니다.
              </li>
              <li>
                운영자는 회원 상호간 또는 회원과 제3자 상호간에 서비스를 매개로 발생한 분쟁에 대해서는 개입할 의무가 없으며,
                이로 인한 손해를 배상할 책임도 없습니다.
              </li>
              <li>
                운영자는 무료로 제공하는 서비스 이용과 관련하여 관련법에 특별한 규정이 없는 한 책임을 지지 않습니다.
              </li>
              <li>
                운영자는 AI 콘텐츠 생성 서비스로 생성된 결과물의 정확성, 신뢰성, 적법성에 대해 보증하지 않으며,
                이를 사용함으로 인해 발생하는 손해에 대해 책임을 지지 않습니다.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제23조 (분쟁해결)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                운영자는 회원이 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상 처리하기 위하여 고충처리팀을
                운영합니다.
              </li>
              <li>
                운영자는 회원으로부터 제출되는 불만사항 및 의견을 우선적으로 처리합니다. 다만, 신속한 처리가 곤란한 경우에는
                회원에게 그 사유와 처리일정을 통보해 드립니다.
              </li>
              <li>
                운영자와 회원 간에 발생한 분쟁은 다음의 절차에 따라 해결합니다.
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>1단계 (당사자 협의)</strong>: 운영자와 회원은 분쟁 발생 시 상호 협의하여 해결합니다.</li>
                  <li><strong>2단계 (외부 조정)</strong>: 협의가 이루어지지 않는 경우, 「전자상거래 등에서의 소비자보호에 관한 법률」에 따른
                  공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
                  <li><strong>3단계 (법원 소송)</strong>: 조정으로 해결되지 않는 경우, 관할법원에 소송을 제기할 수 있습니다.</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제24조 (분쟁조정기관 안내)</h3>
            <p>회원은 서비스 이용과 관련하여 발생한 분쟁에 대해 다음의 기관에 분쟁 조정을 신청할 수 있습니다.</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>한국소비자원</strong>: 전화 1372, 홈페이지 www.kca.go.kr
              </li>
              <li>
                <strong>전자거래분쟁조정위원회</strong>: 전화 1661-5714, 홈페이지 www.ecmc.or.kr
              </li>
              <li>
                <strong>개인정보분쟁조정위원회</strong>: 전화 1833-6972, 홈페이지 www.kopico.go.kr
              </li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제25조 (재판권 및 준거법)</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>
                이 약관의 해석 및 운영자와 회원 간의 분쟁에 대하여는 대한민국의 법령을 적용합니다.
              </li>
              <li>
                서비스 이용 중 발생한 회원과 운영자 간의 소송은 민사소송법에 의한 관할법원에 제소합니다.
              </li>
            </ol>
          </section>

          {/* 부칙 */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">부칙</h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6">제1조 (시행일)</h3>
            <p>이 약관은 {getEffectiveDate(currentVersion).replace(/\./g, '년 ').replace(/년 (\d+)$/, '월 $1일')}부터 시행합니다.</p>
          </section>

          {/* 개정 이력 안내 */}
          <section className="not-prose mt-12 p-6 bg-slate-100 rounded-xl">
            <h4 className="font-semibold text-slate-900 mb-3">개정 이력</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {TERMS_DOCUMENT.versions.slice(0, 3).map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-slate-400 tabular-nums">{v.effectiveDate}</span>
                  <span className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded">v{v.version}</span>
                  <span>{v.summary}</span>
                </li>
              ))}
            </ul>
            {TERMS_DOCUMENT.versions.length > 3 && (
              <Link
                href="/legal/history"
                className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700"
              >
                전체 이력 보기 →
              </Link>
            )}
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2025 SideDish. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/legal/terms" className="text-indigo-600">서비스 이용약관</Link>
            <span>|</span>
            <Link href="/legal/privacy" className="hover:text-indigo-600">개인정보 처리방침</Link>
            <span>|</span>
            <Link href="/legal/history" className="hover:text-indigo-600">변경 이력</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TermsOfServicePage
