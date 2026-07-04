export function ErrorPage({ status = 404, message = '链接不存在' }: { status?: number; message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">{status}</h1>
        <p className="text-gray-500 text-lg mb-2">{message}</p>
        <p className="text-gray-400 text-sm">请检查链接是否正确</p>
      </div>
    </div>
  );
}
