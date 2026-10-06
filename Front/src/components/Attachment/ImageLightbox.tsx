import {useEffect} from 'react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ZoomableImage from './ZoomableImage';

type ImageLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

// Same backdrop + ZoomableImage as AttachmentsSection's
// AttachmentPreviewLightbox, minus its blob fetch/Download - for callers
// that already hold a resolved image URL (the MarkdownEditor, see
// tiptap/openImageLightbox).
const ImageLightbox = ({src, alt, onClose}: ImageLightboxProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/85">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{alt}</span>
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          leftIcon={<X className="h-4 w-4" />}
          onClick={onClose}
          className="h-8 w-8 min-w-0 shrink-0 rounded-md text-zinc-300 hover:bg-white/10 hover:text-white"
        />
      </div>

      <div className="flex min-h-0 flex-1 px-8 pb-8">
        <ZoomableImage src={src} alt={alt} onBackdropClick={onClose} />
      </div>
    </div>
  );
};

export default ImageLightbox;
