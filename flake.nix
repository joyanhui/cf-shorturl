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

      pick =
        set: names:
        map (n: pkgs.lib.getAttrFromPath (pkgs.lib.splitString "." n) set) (pkgs.lib.splitString "|" names);
      pkgList = pick pkgs;

      basePackages = pkgList "fish";
      jsPackages = pkgList "bun";
      cloudflarePackages = pkgList "wrangler";
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = basePackages ++ jsPackages ++ cloudflarePackages;

        shellHook = ''
          echo "== cf-shorturl devShell =="
          echo "  bun = $(bun --version 2>/dev/null) wrangler = $(wrangler --version 2>/dev/null)"
          echo "  本地开发: bun dev；构建: bun run build；测试: bun test"
          if [ -t 0 ] && command -v fish >/dev/null 2>&1; then
            export __FISH_DEVSHELL=1
            exec fish
          fi
        '';
      };
    };
}
