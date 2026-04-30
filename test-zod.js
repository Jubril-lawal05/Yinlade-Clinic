const { z } = require("zod");
const UpdatePatient = z.object({
  name: z.string().min(1).optional(),
  age: z.union([z.string(), z.number()]).optional().or(z.literal("")).optional(),
  displayId: z.string().optional().or(z.literal("")).optional(),
  dob: z.string().optional(),
});
console.log(UpdatePatient.safeParse({ displayId: "001" }).success);
console.log(UpdatePatient.safeParse({ displayId: "001" }).error);
