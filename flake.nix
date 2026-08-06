{
  description = "Cloudflare Worker (Hono+React) 开发环境";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
        };
      };

      jsPackages = with pkgs; [
        bun
      ];

      cloudflarePackages = with pkgs; [
        wrangler
      ];
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = jsPackages ++ cloudflarePackages ++ [ pkgs.fish ];

        shellHook = ''
          echo "== cf-shorturl devShell =="
          echo "  bun      = $(bun --version 2>/dev/null)"
          echo "  wrangler = $(wrangler --version 2>/dev/null)"
          echo "  本地开发: bun dev；构建: bun run build；测试: bun test"
          # 默认落进 fish（带专门 dev 主题，与系统 bash/fish 明确区分）
          # 仅在交互式 TTY 下 exec，命令行模式（nix develop -c）保留原 shell
          if [ -t 0 ] && command -v fish >/dev/null 2>&1; then
            export __FISH_DEVSHELL=1
            exec fish
          fi
        '';
      };
    };
}
