import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
            <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg sm:p-10 dark:bg-gray-800">
                <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-gray-100">
                    アプリについて
                </h1>
                <p className="mb-8 text-gray-700 dark:text-gray-300">
                    text-speakerは、入力した文章をブラウザーや端末に搭載された音声で読み上げるアプリです。
                    日本語音声を選び、読み上げ速度を調整しながら利用できます。
                </p>

                <section className="mb-8">
                    <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
                        使い方
                    </h2>
                    <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                        <li>読み上げ画面で文章を入力します（最大10,000文字）。</li>
                        <li>利用する日本語音声を選び、読み上げ速度を0.5xから2.0xの間で調整します。</li>
                        <li>再生、一時停止、再開、停止の操作で読み上げを進めます。</li>
                    </ol>
                </section>

                <section className="mb-8">
                    <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
                        主な機能
                    </h2>
                    <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                        <li>長い文章は最大500文字ずつに分けて、続けて読み上げます。</li>
                        <li>読み上げの状態と進捗を画面で確認できます。</li>
                        <li>読み上げに失敗した場合は、失敗した箇所から再試行できます。</li>
                        <li>ヘッダーのボタンでライトモードとダークモードを切り替えられます。</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
                        音声とプライバシーについて
                    </h2>
                    <p className="mb-3 text-gray-700 dark:text-gray-300">
                        音声合成はブラウザーまたは端末の機能を利用します。利用できる音声や対応状況は環境によって異なり、日本語音声がない場合は端末に追加してください。
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                        入力した文章や読み上げ設定は保存せず、アプリから外部サービスへ送信しません。ただし、ブラウザーや端末の音声合成処理がネットワーク通信を伴うかは保証できません。
                    </p>
                </section>

                <Link
                    href="/"
                    className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
                >
                    読み上げ画面に戻る
                </Link>
            </article>
        </main>
    );
}
