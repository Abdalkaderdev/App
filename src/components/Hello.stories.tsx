import type { Meta, StoryObj } from "@storybook/react";
import { Hello } from "./Hello";

const meta: Meta<typeof Hello> = {
  title: "Components/Hello",
  component: Hello,
  parameters: {
    layout: "centered",
  },
  args: {
    name: "World",
  },
};

export default meta;

type Story = StoryObj<typeof Hello>;

export const Default: Story = {};
