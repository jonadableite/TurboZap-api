import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  // Format: +55 (11) 99999-9999
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'text-[var(--rocket-green)]';
    case 'disconnected':
      return 'text-[var(--rocket-danger)]';
    case 'connecting':
    case 'qr_code':
      return 'text-[var(--rocket-warning)]';
    default:
      return 'text-[var(--rocket-gray-400)]';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'bg-[var(--rocket-green)]';
    case 'disconnected':
      return 'bg-[var(--rocket-danger)]';
    case 'connecting':
    case 'qr_code':
      return 'bg-[var(--rocket-warning)]';
    default:
      return 'bg-[var(--rocket-gray-400)]';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return 'Conectado';
    case 'disconnected':
      return 'Desconectado';
    case 'connecting':
      return 'Conectando...';
    case 'qr_code':
      return 'Aguardando QR Code';
    default:
      return 'Desconhecido';
  }
}

