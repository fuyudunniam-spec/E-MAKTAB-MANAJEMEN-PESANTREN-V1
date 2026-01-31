import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Type, 
  Heading1, 
  Image, 
  Video, 
  Code, 
  Quote,
  List,
  ChevronUp,
  ChevronDown,
  Images,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageUpload } from './ImageUpload';

export type BlockType = 'text' | 'heading' | 'image' | 'gallery' | 'video' | 'embed' | 'quote' | 'list';

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  position: number;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const blockTypeConfig = {
  text: { icon: Type, label: 'Teks' },
  heading: { icon: Heading1, label: 'Heading' },
  image: { icon: Image, label: 'Gambar' },
  gallery: { icon: Images, label: 'Galeri Foto' },
  video: { icon: Video, label: 'Video' },
  embed: { icon: Code, label: 'Embed' },
  quote: { icon: Quote, label: 'Kutipan' },
  list: { icon: List, label: 'Daftar' },
};

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      position: blocks.length,
    };
    onChange([...blocks, newBlock]);
  };

  const getDefaultContent = (type: BlockType): Record<string, any> => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'heading':
        return { text: '', level: 2 };
      case 'image':
        return { url: '', alt: '', caption: '' };
      case 'gallery':
        return { images: [], columns: 3, caption: '' };
      case 'video':
        return { url: '', caption: '' };
      case 'embed':
        return { code: '' };
      case 'quote':
        return { text: '', author: '' };
      case 'list':
        return { items: [''], ordered: false };
      default:
        return {};
    }
  };

  const updateBlock = (id: string, content: Record<string, any>) => {
    onChange(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(block => block.id !== id).map((block, index) => ({
      ...block,
      position: index
    })));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === blocks.length - 1)
    ) return;

    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    
    onChange(newBlocks.map((block, i) => ({ ...block, position: i })));
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Card key={block.id} className="relative">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveBlock(block.id, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveBlock(block.id, 'down')}
                  disabled={index === blocks.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {blockTypeConfig[block.type].label}
                  </span>
                </div>
                <BlockContent 
                  block={block} 
                  onChange={(content) => updateBlock(block.id, content)} 
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeBlock(block.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Blok
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {Object.entries(blockTypeConfig).map(([type, config]) => (
            <DropdownMenuItem 
              key={type} 
              onClick={() => addBlock(type as BlockType)}
            >
              <config.icon className="mr-2 h-4 w-4" />
              {config.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface BlockContentProps {
  block: Block;
  onChange: (content: Record<string, any>) => void;
}

function BlockContent({ block, onChange }: BlockContentProps) {
  const { type, content } = block;

  switch (type) {
    case 'text':
      return (
        <Textarea
          placeholder="Tulis teks di sini..."
          value={content.text || ''}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          rows={4}
        />
      );

    case 'heading':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((level) => (
              <Button
                key={level}
                type="button"
                variant={content.level === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...content, level })}
              >
                H{level}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Heading text..."
            value={content.text || ''}
            onChange={(e) => onChange({ ...content, text: e.target.value })}
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <ImageUpload
            value={content.url || ''}
            onChange={(url) => onChange({ ...content, url })}
            bucket="post-images"
            folder="pages"
          />
          <Input
            placeholder="Alt text (untuk aksesibilitas)"
            value={content.alt || ''}
            onChange={(e) => onChange({ ...content, alt: e.target.value })}
          />
          <Input
            placeholder="Caption (opsional)"
            value={content.caption || ''}
            onChange={(e) => onChange({ ...content, caption: e.target.value })}
          />
        </div>
      );

    case 'gallery':
      return (
        <GalleryBlockEditor content={content} onChange={onChange} />
      );

    case 'video':
      return (
        <div className="space-y-3">
          <Input
            placeholder="URL Video (YouTube, Vimeo, dll)"
            value={content.url || ''}
            onChange={(e) => onChange({ ...content, url: e.target.value })}
          />
          <Input
            placeholder="Caption (opsional)"
            value={content.caption || ''}
            onChange={(e) => onChange({ ...content, caption: e.target.value })}
          />
        </div>
      );

    case 'embed':
      return (
        <Textarea
          placeholder="Paste embed code (iframe, script, dll)..."
          value={content.code || ''}
          onChange={(e) => onChange({ ...content, code: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
      );

    case 'quote':
      return (
        <div className="space-y-2">
          <Textarea
            placeholder="Kutipan..."
            value={content.text || ''}
            onChange={(e) => onChange({ ...content, text: e.target.value })}
            rows={3}
          />
          <Input
            placeholder="Penulis (opsional)"
            value={content.author || ''}
            onChange={(e) => onChange({ ...content, author: e.target.value })}
          />
        </div>
      );

    case 'list':
      return (
        <ListBlockEditor content={content} onChange={onChange} />
      );

    default:
      return null;
  }
}

interface ListBlockEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

function ListBlockEditor({ content, onChange }: ListBlockEditorProps) {
  const items = content.items || [''];

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange({ ...content, items: newItems });
  };

  const addItem = () => {
    onChange({ ...content, items: [...items, ''] });
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    onChange({ ...content, items: items.filter((_: string, i: number) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!content.ordered ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ ...content, ordered: false })}
        >
          Bullet
        </Button>
        <Button
          type="button"
          variant={content.ordered ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ ...content, ordered: true })}
        >
          Numbered
        </Button>
      </div>
      {items.map((item: string, index: number) => (
        <div key={index} className="flex gap-2">
          <span className="flex items-center justify-center w-6 text-muted-foreground">
            {content.ordered ? `${index + 1}.` : '•'}
          </span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder="Item..."
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            disabled={items.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Item
      </Button>
    </div>
  );
}

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

interface GalleryBlockEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

function GalleryBlockEditor({ content, onChange }: GalleryBlockEditorProps) {
  const images: GalleryImage[] = content.images || [];
  const columns = content.columns || 3;

  const addImage = (url: string) => {
    const newImages = [...images, { url, alt: '', caption: '' }];
    onChange({ ...content, images: newImages });
  };

  const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange({ ...content, images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange({ ...content, images: newImages });
  };

  return (
    <div className="space-y-4">
      {/* Column selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Kolom:</span>
        {[2, 3, 4].map((col) => (
          <Button
            key={col}
            type="button"
            variant={columns === col ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({ ...content, columns: col })}
          >
            {col}
          </Button>
        ))}
      </div>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.alt || `Gambar ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <Input
                placeholder="Alt text"
                value={image.alt}
                onChange={(e) => updateImage(index, 'alt', e.target.value)}
                className="mt-1 text-xs h-7"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add image */}
      <ImageUpload
        value=""
        onChange={addImage}
        bucket="post-images"
        folder="gallery"
      />

      {/* Caption for entire gallery */}
      <Input
        placeholder="Caption galeri (opsional)"
        value={content.caption || ''}
        onChange={(e) => onChange({ ...content, caption: e.target.value })}
      />
    </div>
  );
}
