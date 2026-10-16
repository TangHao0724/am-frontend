
import { Description, Field, Input, Label } from "@headlessui/react";

type Props = {
  title: string;
  desc?: string;
  value: string;
  onChange: (data: string) => void;
  type?: "text" | "password" | "email";
  name?: string;
  placeholder?: string;
};

export default function LoginInput({
  title,
  desc,
  value,
  onChange,
  type = "text",
  name,
  placeholder,
}: Props) {
  return (
    <Field className="flex flex-col gap-1">
      <Label className="font-medium">{title}</Label>

      {desc && (
        <Description className="text-sm text-gray-500">
          {desc}
        </Description>
      )}

      <Input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-main-3 text-md p-2 rounded-md outline-none focus:ring-2 focus:ring-main-2"
      />
    </Field>
  );
}

