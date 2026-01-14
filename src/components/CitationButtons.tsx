import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Quote } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface CitationButtonsProps {
  title: string;
  author: string | null;
  authorFamilyName: string | null;
  editor: string | null;
  publisher: string | null;
  publisherCity: string | null;
  publishYear: number | null;
  edition: string | null;
  pages: number | null;
  doi: string | null;
  isbn: string | null;
}

export const CitationButtons = ({
  title,
  author,
  authorFamilyName,
  editor,
  publisher,
  publisherCity,
  publishYear,
  edition,
  pages,
  doi,
  isbn,
}: CitationButtonsProps) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const { toast } = useToast();

  // Parse author name for citations
  const parseAuthorName = () => {
    if (!author) return { firstName: "", lastName: "" };
    
    // If family name is explicitly provided, use it
    if (authorFamilyName) {
      const firstName = author.replace(authorFamilyName, "").trim().replace(/,\s*$/, "");
      return { firstName, lastName: authorFamilyName };
    }
    
    // Otherwise, try to split by comma or space
    const parts = author.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      return { lastName: parts[0], firstName: parts[1] };
    }
    
    const nameParts = author.split(" ");
    if (nameParts.length >= 2) {
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.slice(0, -1).join(" ");
      return { firstName, lastName };
    }
    
    return { firstName: "", lastName: author };
  };

  const { firstName, lastName } = parseAuthorName();

  // Format initials for certain citation styles
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n.charAt(0).toUpperCase() + ".")
      .join(" ");
  };

  // APA 7th Edition Format
  const formatAPA = () => {
    let citation = "";
    
    // Author
    if (lastName) {
      citation += `${lastName}, ${getInitials(firstName)}`;
    }
    
    // Year
    if (publishYear) {
      citation += ` (${publishYear}).`;
    } else {
      citation += " (n.d.).";
    }
    
    // Title (italicized - we use plain text but note it should be italic)
    citation += ` ${title}`;
    
    // Edition
    if (edition) {
      citation += ` (${edition})`;
    }
    
    citation += ".";
    
    // Publisher with city
    if (publisherCity && publisher) {
      citation += ` ${publisherCity}: ${publisher}.`;
    } else if (publisher) {
      citation += ` ${publisher}.`;
    }
    
    // DOI
    if (doi) {
      citation += ` https://doi.org/${doi}`;
    }
    
    return citation.trim();
  };

  // MLA 9th Edition Format
  const formatMLA = () => {
    let citation = "";
    
    // Author
    if (lastName && firstName) {
      citation += `${lastName}, ${firstName}`;
    } else if (author) {
      citation += author;
    }
    
    citation += ". ";
    
    // Title (italicized)
    citation += `${title}. `;
    
    // Edition
    if (edition) {
      citation += `${edition}, `;
    }
    
    // Publisher with city
    if (publisherCity && publisher) {
      citation += `${publisherCity}: ${publisher}, `;
    } else if (publisher) {
      citation += `${publisher}, `;
    }
    
    // Year
    if (publishYear) {
      citation += `${publishYear}.`;
    }
    
    return citation.trim().replace(/,\.$/, ".");
  };

  // Chicago 17th Edition (Notes-Bibliography) Format
  const formatChicago = () => {
    let citation = "";
    
    // Author
    if (firstName && lastName) {
      citation += `${firstName} ${lastName}`;
    } else if (author) {
      citation += author;
    }
    
    citation += ", ";
    
    // Title (italicized)
    citation += `${title}`;
    
    // Edition
    if (edition) {
      citation += `, ${edition}`;
    }
    
    // Location and Publisher (Chicago uses: City: Publisher, Year)
    if (publisherCity && publisher) {
      citation += ` (${publisherCity}: ${publisher}`;
      if (publishYear) {
        citation += `, ${publishYear}`;
      }
      citation += ")";
    } else if (publisher) {
      citation += ` (${publisher}`;
      if (publishYear) {
        citation += `, ${publishYear}`;
      }
      citation += ")";
    } else if (publishYear) {
      citation += ` (${publishYear})`;
    }
    
    citation += ".";
    
    // DOI
    if (doi) {
      citation += ` https://doi.org/${doi}.`;
    }
    
    return citation.trim();
  };

  // Harvard Format
  const formatHarvard = () => {
    let citation = "";
    
    // Author
    if (lastName) {
      citation += `${lastName}, ${getInitials(firstName)}`;
    }
    
    // Year
    if (publishYear) {
      citation += ` (${publishYear})`;
    } else {
      citation += " (n.d.)";
    }
    
    // Title (italicized)
    citation += ` ${title}.`;
    
    // Edition
    if (edition) {
      citation += ` ${edition}.`;
    }
    
    // Publisher with city
    if (publisherCity && publisher) {
      citation += ` ${publisherCity}: ${publisher}.`;
    } else if (publisher) {
      citation += ` ${publisher}.`;
    }
    
    return citation.trim();
  };

  const citations = {
    APA: formatAPA(),
    MLA: formatMLA(),
    Chicago: formatChicago(),
    Harvard: formatHarvard(),
  };

  const copyToClipboard = async (format: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      toast({
        title: "Berhasil Disalin!",
        description: `Citation format ${format} telah disalin ke clipboard.`,
      });
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      toast({
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin ke clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Quote className="w-4 h-4" />
        Salin Citation
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(citations).map(([format, text]) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => copyToClipboard(format, text)}
          >
            {copiedFormat === format ? (
              <Check className="w-3 h-3 mr-1 text-primary" />
            ) : (
              <Copy className="w-3 h-3 mr-1" />
            )}
            {format}
          </Button>
        ))}
      </div>
      
      {/* Preview of currently selected citation */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Lihat Format Citation
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px] max-h-[300px] overflow-y-auto">
          {Object.entries(citations).map(([format, text]) => (
            <DropdownMenuItem
              key={format}
              className="flex flex-col items-start gap-1 cursor-pointer"
              onClick={() => copyToClipboard(format, text)}
            >
              <span className="font-semibold text-xs">{format}:</span>
              <span className="text-xs text-muted-foreground italic leading-relaxed">
                {text}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
