import React from 'react';
import { BRAND, toWhatsappHref } from '@/lib/brand';
import WhatsappIcon from '@/components/ui/whatsapp-icon';

export default function WhatsappButton() {
  // Without a configured number the link would open an empty wa.me page.
  const [primary] = BRAND.whatsapp;
  if (!primary) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a href={toWhatsappHref(primary)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <button className="flex items-center justify-center w-[45px] h-[45px] border-none rounded-full cursor-pointer relative overflow-hidden transition-all duration-300 shadow-[2px_2px_10px_rgba(0,0,0,0.199)] bg-[#00d757] active:translate-x-[2px] active:translate-y-[2px]">
          <WhatsappIcon className="w-[25px] text-white" />
        </button>
      </a>
    </div>
  );
}
