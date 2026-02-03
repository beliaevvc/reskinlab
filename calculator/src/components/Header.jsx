export function Header() {
  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
      <div className="w-9 h-9 bg-emerald-500 rounded-md flex items-center justify-center font-bold text-white text-base">
        R
      </div>
      <h1 className="font-semibold text-lg hidden sm:block text-neutral-900">
        ReSkin Lab{" "}
        <span className="text-neutral-400 font-normal text-sm">Calculator v2.1</span>
      </h1>
    </header>
  );
}

export default Header;
