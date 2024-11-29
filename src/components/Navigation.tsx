export const Navigation: React.FC = () => {
  return (
    <nav className="mt-8 border-b">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-8">
          <button className="py-4 border-b-2 border-black font-semibold text-black">
            Home
          </button>
          <button className="py-4 text-gray-500 font-medium hover:text-black">
            About
          </button>
        </div>
      </div>
    </nav>
  );
};