import React, { useState } from "react";
import { Download, Copy, Check, BookOpen, Printer, FileText, CheckCircle2 } from "lucide-react";

interface ReportViewProps {
  reportMarkdown: string;
  onDownloadMarkdown: () => void;
  onDownloadStateJson: () => void;
  onExportPdf?: () => void;
}

function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-zinc-100 text-emerald-800 px-1 py-0.5 rounded font-mono text-[11px] border border-zinc-200">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a key={match.index} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-medium">
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-zinc-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

export const ReportView: React.FC<ReportViewProps> = ({
  reportMarkdown,
  onDownloadMarkdown,
  onDownloadStateJson,
  onExportPdf,
}) => {
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    setPdfGenerating(true);

    const titleMatch = reportMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : "Autonomous Multi-Agent Research Report";

    let htmlBody = reportMarkdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, '</p><p>');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 1.8cm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #111827;
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 19pt; color: #044E54; margin-bottom: 6px; font-weight: 700; }
    h2 { font-size: 13pt; color: #065F46; margin-top: 20px; margin-bottom: 8px; border-bottom: 1.5px solid #E5E7EB; padding-bottom: 4px; font-weight: 600; }
    h3 { font-size: 11pt; color: #1F2937; margin-top: 14px; margin-bottom: 4px; font-weight: 600; }
    p, li { margin: 5px 0; color: #374151; font-size: 10pt; }
    code { font-size: 9pt; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #F3F4F6; padding: 2px 4px; border-radius: 4px; color: #065F46; }
    hr { border: none; border-top: 1px solid #E5E7EB; margin: 16px 0; }
    .meta { color: #6B7280; font-size: 9pt; margin-bottom: 14px; font-family: ui-monospace, monospace; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    th { background: #F9FAFB; border: 1px solid #D1D5DB; padding: 6px 8px; text-align: left; font-weight: 600; color: #111827; }
    td { border: 1px solid #E5E7EB; padding: 6px 8px; vertical-align: top; }
    blockquote { border-left: 3px solid #059669; background: #F0FDF4; padding: 8px 14px; margin: 10px 0; color: #064E3B; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · Autonomous Multi-Agent Research Assistant · Federated: OpenAlex + arXiv + S2</div>
  <hr/>
  <p>${htmlBody}</p>
</body>
</html>`;

    try {
      const hiddenIframe = document.createElement("iframe");
      hiddenIframe.style.position = "fixed";
      hiddenIframe.style.right = "0";
      hiddenIframe.style.bottom = "0";
      hiddenIframe.style.width = "0";
      hiddenIframe.style.height = "0";
      hiddenIframe.style.border = "0";
      document.body.appendChild(hiddenIframe);

      const doc = hiddenIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          hiddenIframe.contentWindow?.focus();
          hiddenIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(hiddenIframe);
            setPdfGenerating(false);
          }, 1000);
        }, 500);
      } else {
        const blob = new Blob([htmlContent], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_report.html`;
        a.click();
        setPdfGenerating(false);
      }
    } catch {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_report.html`;
      a.click();
      setPdfGenerating(false);
    }
  };

  const renderStructuredContent = () => {
    if (!reportMarkdown) {
      return (
        <div className="p-8 text-center text-zinc-400 text-sm">
          No report generated yet. Run the workflow and approve checkpoints to generate the final verified research report.
        </div>
      );
    }

    const lines = reportMarkdown.split("\n");
    const elements: React.ReactNode[] = [];
    let currentTable: string[] = [];
    let currentList: string[] = [];
    let keyCounter = 0;

    const flushTable = () => {
      if (currentTable.length > 0) {
        const rows = currentTable;
        currentTable = [];
        elements.push(
          <div key={`table-${keyCounter++}`} className="overflow-x-auto my-4 border border-zinc-200 rounded-lg shadow-xs">
            <table className="w-full text-left text-xs bg-white">
              <tbody>
                {rows.map((row, rIdx) => {
                  if (row.includes("---")) return null;
                  const cells = row.split("|").filter((c) => c.trim().length > 0);
                  const isHeader = rIdx === 0;
                  return (
                    <tr key={rIdx} className={isHeader ? "bg-zinc-50 font-bold border-b border-zinc-200 text-zinc-900" : "border-b border-zinc-100 hover:bg-zinc-50/70 text-zinc-800"}>
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3">
                          {formatInlineMarkdown(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        const items = currentList;
        currentList = [];
        elements.push(
          <ul key={`list-${keyCounter++}`} className="space-y-2 my-2.5 list-disc list-outside ml-5 text-xs text-zinc-700 leading-relaxed">
            {items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {formatInlineMarkdown(it)}
              </li>
            ))}
          </ul>
        );
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("|") && line.endsWith("|")) {
        flushList();
        currentTable.push(line);
        continue;
      } else {
        flushTable();
      }

      if (line.startsWith("- ") || line.startsWith("* ")) {
        currentList.push(line.substring(2));
        continue;
      } else {
        flushList();
      }

      if (line === "---") {
        elements.push(<hr key={`hr-${keyCounter++}`} className="my-5 border-zinc-200" />);
        continue;
      }

      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${keyCounter++}`} className="text-xl md:text-2xl font-bold text-zinc-900 pb-2 border-b border-zinc-200 mt-2 mb-4 tracking-tight">
            {formatInlineMarkdown(line.replace("# ", ""))}
          </h1>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${keyCounter++}`} className="text-base md:text-lg font-bold text-emerald-900 mt-6 pt-3 border-t border-zinc-200 mb-2.5">
            {formatInlineMarkdown(line.replace("## ", ""))}
          </h2>
        );
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${keyCounter++}`} className="text-sm md:text-base font-semibold text-zinc-900 mt-4 mb-1.5">
            {formatInlineMarkdown(line.replace("### ", ""))}
          </h3>
        );
        continue;
      }

      if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={`quote-${keyCounter++}`} className="p-3 my-2.5 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-lg text-emerald-950 text-xs italic">
            {formatInlineMarkdown(line.replace("> ", ""))}
          </blockquote>
        );
        continue;
      }

      if (line.length > 0) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="text-xs md:text-sm text-zinc-700 leading-relaxed my-2">
            {formatInlineMarkdown(line)}
          </p>
        );
      }
    }

    flushTable();
    flushList();

    return elements;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm text-zinc-100">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Verified Synthesis Publication Draft</h3>
          <span className="text-xs text-zinc-600">·</span>
          <span className="text-xs text-zinc-400 font-mono">
            {reportMarkdown ? `${reportMarkdown.split(/\s+/).filter(Boolean).length} words` : "0 words"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode("formatted")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "formatted"
                  ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Publication View
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "raw"
                  ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Raw Markdown
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onDownloadMarkdown}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handlePrintPdf}
            disabled={pdfGenerating}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-zinc-950 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate PDF Report</span>
          </button>

          <button
            onClick={onDownloadStateJson}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>State JSON</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 md:p-8 max-h-[700px] overflow-y-auto bg-zinc-950" id="report-render-area">
        {viewMode === "formatted" ? (
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 md:p-10 shadow-lg border border-zinc-200 text-zinc-900 font-sans">
            <article className="space-y-2">
              {renderStructuredContent()}
            </article>
          </div>
        ) : (
          <pre className="font-mono text-xs text-zinc-300 bg-zinc-900/90 p-5 rounded-lg border border-zinc-800 whitespace-pre-wrap leading-relaxed max-w-4xl mx-auto">
            <code>{reportMarkdown}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
