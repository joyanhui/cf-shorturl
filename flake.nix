{
  description = "Cloudflare Worker (Hono+React) 开发环境";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
        };
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          bun
          wrangler
        ];

        shellHook = ''
          echo "== cf-shorturl devShell =="
          echo "  bun      = $(bun --version 2>/dev/null)"
          echo "  wrangler = $(wrangler --version 2>/dev/null)"
          echo "  本地开发: bun dev；构建: bun run build；测试: bun test"
        '';
      };
    };
}
