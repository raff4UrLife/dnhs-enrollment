///components/ui/form-fields.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("text-sm font-medium text-primary", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={!!error}
      className={cn(
        "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        error && "border-destructive focus-visible:ring-destructive",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(function Select({ className, error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={!!error}
      className={cn(
        "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
        error && "border-destructive focus-visible:ring-destructive",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2.5 rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground">
      <input
        type="checkbox"
        className={cn("h-4 w-4 accent-primary", className)}
        {...props}
      />
      {label}
    </label>
  );
}

export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="border-b border-white/15 pb-2 text-sm font-semibold text-white">
        {title}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Field({
  children,
  full,
  error,
}: {
  children: React.ReactNode;
  full?: boolean;
  error?: string;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// import * as React from "react";
// import { cn } from "@/lib/utils";

// export function Label({
//   className,
//   required,
//   children,
//   ...props
// }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
//   return (
//     <label
//       className={cn("text-sm font-medium text-primary", className)}
//       {...props}
//     >
//       {children}
//       {required && <span className="ml-0.5 text-destructive">*</span>}
//     </label>
//   );
// }

// export const Input = React.forwardRef<
//   HTMLInputElement,
//   React.InputHTMLAttributes<HTMLInputElement>
// >(function Input({ className, ...props }, ref) {
//   return (
//     <input
//       ref={ref}
//       className={cn(
//         "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
//         className,
//       )}
//       {...props}
//     />
//   );
// });

// export const Select = React.forwardRef<
//   HTMLSelectElement,
//   React.SelectHTMLAttributes<HTMLSelectElement>
// >(function Select({ className, children, ...props }, ref) {
//   return (
//     <select
//       ref={ref}
//       className={cn(
//         "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
//         className,
//       )}
//       {...props}
//     >
//       {children}
//     </select>
//   );
// });

// export function Checkbox({
//   className,
//   label,
//   ...props
// }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
//   return (
//     <label className="flex items-center gap-2.5 rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground">
//       <input
//         type="checkbox"
//         className={cn("h-4 w-4 accent-primary", className)}
//         {...props}
//       />
//       {label}
//     </label>
//   );
// }

// export function FieldGroup({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <h2 className="border-b border-white/15 pb-2 text-sm font-semibold text-white">
//         {title}
//       </h2>
//       <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
//     </div>
//   );
// }

// export function Field({
//   children,
//   full,
// }: {
//   children: React.ReactNode;
//   full?: boolean;
// }) {
//   return (
//     <div className={cn("space-y-1.5", full && "sm:col-span-2")}>{children}</div>
//   );
// }
