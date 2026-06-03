import { Instagram } from 'lucide-react';

export default function Footer() {
    return (
      <footer className="font-libre bg-paperLight dark:bg-paperDark text-fontPrimaryLight dark:text-fontSecondaryDark px-6 py-8 mt-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          
          <div>
            <p className="font-semibold mb-1">Copyright</p>
            <p>ALL RIGHTS RESERVED © 2025</p>
          </div>
  
          <div>
            <p className="font-semibold mb-1">Contact us</p>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              <a href="#" className="hover:underline">Instagram</a>
            </div>
          </div>
  
          <div>
            <p className="font-semibold mb-1">Designed by</p>
            <p>Magda 😄</p>
          </div>
  
          <div>
            <p className="font-semibold mb-1">Photo credits</p>
            <p><a href="#" className="hover:underline">Links here</a></p>
          </div>
  
        </div>
      </footer>
    );
  }
  