
export default function Footer() {
    return (
      <footer className="font-libre bg-paperLight dark:bg-paperDark text-fontPrimaryLight dark:text-fontSecondaryDark px-6 py-8 mt-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-3 sm:grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          
          <div>
            <p className="font-semibold mb-1">© {new Date().getFullYear()} Lexaria</p>
            <p>For books enthusiasts</p>
          </div>
  
          <div>
            <p className="font-semibold mb-1">Project</p>
            <p>Personal learning project built with React & FastAPI</p>
          </div>
  
          <div>
            <p className="font-semibold mb-1">Credits</p>
            <p>Designed & developed by Magda Vasilache</p>
          </div>
  
        </div>
      </footer>
    );
  }
  