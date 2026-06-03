import { Loader } from 'lucide-react';

interface Props {
  buttonText: string;
  loading: boolean;
}

export default function SubmitButton({ buttonText, loading }: Props) {
  return (
    <button
      className={`font-libre w-full px-4 py-2 ${loading ? 'bg-primaryDisabledLight dark:bg-primaryDisabledDark ' : 'bg-primaryLight dark:bg-primaryDark '} text-fontSecondaryLight dark:text-fontPrimaryDark hover:bg-primaryLightDarkTone dark:hover:bg-primaryDarkDarkTone
            dark:hover:text-fontSecondaryDark shadow-buttonShadow dark:shadow-buttonShadowDark text-xl rounded-xs transition shadow-buttonShadow flex items-center justify-center`}

      type="submit"
      disabled={loading}
    >
      {loading ? <Loader className='animate-spin' /> : buttonText}
    </button>
  );
}
