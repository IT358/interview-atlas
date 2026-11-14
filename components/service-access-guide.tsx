'use client';
import TavilyConnectGuide from './tavily-connect-guide';
export default function ServiceAccessGuide({service,onTavilyReady}:{service:'tavily'|'gemini';onTavilyReady?:(saved:boolean,consent:boolean)=>void}){
 const search=service==='tavily';
 if(search)return <section className="panel service-access-guide" aria-label="追加Web調査の利用案内"><p>Tavilyは検索・実行ボタンを押したときだけ送信します。月1,000クレジットの無料残量が足りる間は確認なし、不足・残量不明の場合だけこの端末で確認します。</p><TavilyConnectGuide onReady={onTavilyReady}/><div className="actions"><a href="https://app.tavily.com/" target="_blank" rel="noreferrer">Tavilyの料金・残量 ↗</a><a href="https://docs.tavily.com/documentation/api-credits" target="_blank" rel="noreferrer">公式：クレジットの説明 ↗</a></div></section>;
 return <section className="panel service-access-guide" aria-label={search?'追加Web調査の利用案内':'AI評価の利用案内'}>
 <span className="pill">利用前の確認</span><h2>{search?'追加Web調査を使うには':'AI評価を使うには'}</h2>
 <p>{search?'この先はTavilyの検索APIを使用します。':'この先はGoogleのGemini APIを使用します。'}ChatGPTの月額料金とは別のサービスです。</p>
 {search&&<TavilyConnectGuide onReady={onTavilyReady}/>}
 {!search&&<aside className="gemini-contract-notice" aria-labelledby="gemini-contract-title"><h3 id="gemini-contract-title">必須：Gemini APIの契約・請求設定を確認してください</h3><p>「無料のつもり」で使い始めず、利用するAPIキーが属するGoogleのプロジェクトについて、次を確認してください。</p><ul><li><strong>契約プラン：</strong>Free（無料枠）か、有料の請求アカウントが接続されているか。</li><li><strong>請求先：</strong>誰のアカウント・支払い方法に請求されるか。</li><li><strong>自動チャージ：</strong>自動補充が有効か。補充額と月間上限はいくらか。</li><li><strong>支払い方式：</strong>前払いか後払いか。後払いでは利用分の自動請求があります。</li><li><strong>利用条件：</strong>対象モデル・機能の無料枠、残量、リセット日、料金を確認する。</li><li><strong>費用の制限：</strong>設定した上限が「利用の自動停止」なのか「通知のみ」なのかを確認する。</li></ul><p><strong>確認できない場合はAPIを接続・実行せず、アプリ所有者へ相談してください。</strong>有料利用が必要な場合は、費用・支払う人・上限を確認し、実行直前にも改めて確認します。このサイトの注意表示だけでは、Google側の自動請求を停止できません。</p><div className="actions"><a className="primary" href="https://aistudio.google.com/billing" target="_blank" rel="noreferrer">Google公式：請求設定を確認 ↗</a><a className="secondary" href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer">公式の課金・自動チャージの説明 ↗</a></div><small>このアプリはGoogle側の契約・支払い設定を自動確認しません。設定確認だけなら、有料化・購入・自動チャージ有効化の操作は不要です。</small></aside>}
 <dl className="evidence-list"><dt>支払う人</dt><dd>利用するAPIアカウントの契約者。アプリ所有者が自動で負担することはありません。</dd><dt>無料利用</dt><dd>対象機能・無料枠・残量を公式アカウントで確認してください。有料契約が必須とは限りません。</dd><dt>費用・上限</dt><dd>未確認。契約プラン、従量課金、利用上限を公式サイトで確認します。</dd><dt>利用期限</dt><dd>未確認。無料枠のリセット日・契約更新日は利用するアカウントに依存します。</dd></dl>
 <ol><li>公式サイトで無料枠・料金・更新日を確認する。</li><li>無料で利用できない場合は、費用・支払う人・上限を所有者と確認する。有料契約は本人が公式サイトで行う。</li><li>接続前に改めて確認する。契約しただけでは、このアプリとの接続は完了しません。</li></ol>
 <div className="actions"><a className="primary" href={search?'https://www.tavily.com/pricing':'https://ai.google.dev/gemini-api/docs/pricing'} target="_blank" rel="noreferrer">公式の料金・無料枠を確認 ↗</a><a className="secondary" href={search?'https://app.tavily.com/':'https://aistudio.google.com/'} target="_blank" rel="noreferrer">公式アカウントを開く ↗</a></div>
 <p className="notice">この案内を開いても、課金・契約・API送信は発生しません。現在は接続確認前です。外部サービスの請求状態を、このアプリから自動確認する機能はまだありません。</p>
 </section>;
}
