export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-card border-t border-secondary/30 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 text-muted">
            <span className="text-sm font-serif font-medium text-charcoal">Birdie Book</span>
          </div>

          <p className="text-sm text-muted">
            &copy; {currentYear} Birdie Book. All rights reserved.
          </p>

          <div className="flex space-x-4">
            <a href="#" className="text-sm text-muted hover:text-secondary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted hover:text-secondary transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-muted hover:text-secondary transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
