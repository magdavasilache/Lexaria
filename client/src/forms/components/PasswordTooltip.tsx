import { Info } from 'lucide-react';

export default function PasswordTooltip() {
    return (
      <div className="relative group inline-block">
        <Info className="w-5 h-5 text-fontPrimaryLight dark:text-fontSecondaryDark cursor-pointer" />
  
        <div className="absolute z-10 hidden group-hover:block bg-white text-sm text-left text-gray-700 p-4 shadow-lg w-64 top-6 left-1/2 -translate-x-1/2">
          <p className="font-semibold mb-2">Your password must:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Be at least 8 characters long</li>
            <li>Contain one uppercase letter</li>
            <li>Contain one lowercase letter</li>
            <li>Include one number</li>
            <li>Include one special character (e.g., !, @, #, ?)</li>
          </ul>
        </div>
      </div>
    );
  }