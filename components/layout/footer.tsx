export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-gray-500">
            <svg
              className="h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-sm font-medium text-golf-text">GolfTracker</span>
          </div>

          <p className="text-sm text-gray-500">
            &copy; {currentYear} GolfTracker. All rights reserved.
          </p>

          <div className="flex space-x-4">
            <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
